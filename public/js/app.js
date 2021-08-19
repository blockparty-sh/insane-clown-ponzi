const App = {
    web3Provider: null,
    contracts: {},
    transactionParams: {
        gasPrice: "1050000000", // 10 gwei
    },
    clowns: [],
    TENT_SIZE: 300,

    init: async function() {
        const connectToWalletEl = document.getElementById('connect-to-wallet');

        if (typeof web3 === 'undefined') {
            function promptMetamaskInstall() {
                App.showModal('Install MetaMask', `
                    <p>
                    This app requires MetaMask to be installed
                    </p>

                    <p>
                    Download from <a href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn" target="_blank">Chrome Web Store</a>
                    </p>

                    <p>
                    Download from <a href="https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/" target="_blank">Firefox Add-ons page</a>
                    </p>
                `);
            }
            promptMetamaskInstall();

            connectToWalletEl
                .querySelector('img')
                .src = 'img/install-metamask.png';
            
            connectToWalletEl.addEventListener('click', function(evt) {
                evt.preventDefault();
                promptMetamaskInstall();
            });

            // fallback to ganache
            this.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
            web3 = new Web3(this.web3Provider);
        } else {
            this.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        }

        const response = await fetch('build/InsaneClownPonzi.json');
        const InsaneClownPonziArtifact = await response.json();

        const InsaneClownPonzi = TruffleContract(InsaneClownPonziArtifact);
        InsaneClownPonzi.setProvider(this.web3Provider);

        this.contracts.InsaneClownPonzi = InsaneClownPonzi;

        const that = this;
        // provide live update checking of selected network
        let lastNetworkId = null;
        async function checkNetwork() {
            const SMARTBCH_NETWORK_ID         = 10000;
            const SMARTBCH_TESTNET_NETWORK_ID = 10001;
            const GANACHE_NETWORK_ID          = 5777;

            const id = await web3.eth.net.getId();

            if (id === lastNetworkId) {
                return;
            }

            if (id === SMARTBCH_NETWORK_ID
             || id === SMARTBCH_TESTNET_NETWORK_ID
             || id === GANACHE_NETWORK_ID
            ) {
                document.getElementById('incorrect-network').style.display = 'none';
                that.toggleFormDisabled(false);
            } else {
                document.getElementById('incorrect-network').style.display = 'initial';
                that.toggleFormDisabled(true);
            }

            lastNetworkId = id;
        }
        checkNetwork();


        const contract = await this.getContract();
        this.updateContractDetails();


        document.querySelector('#modal-close').addEventListener('click', function() {
            document.querySelector('body').classList.remove('modal-open');
        });

        if (! window.ethereum) {
            return;
        }

        // detect Network account change
        window.ethereum.on('chainChanged', (networkId) => {
            checkNetwork();
            that.updateUserDetails();
        });

        window.ethereum.on('accountChanged', (networkId) => {
            that.updateUserDetails();
        });

        if (window.ethereum.isConnected()) {
            connectToWalletEl
                .querySelector('img')
                .style.display = 'none';
            that.updateUserDetails();
        } else {
            connectToWalletEl.addEventListener('click', async function(evt) {
                evt.preventDefault();
                that.updateUserDetails();
            });
        }

        document.getElementById('deposit-btn').addEventListener('click', async function(evt) {
            evt.preventDefault();

            const from = await that.getAccount();

            const value = new BigNumber(document.getElementById('deposit-amount').value)
                .multipliedBy(new BigNumber('1e18'))
                .toFixed();

			try {
                await web3.eth.sendTransaction({
                    ...that.transactionParams,
                    ...{
                        from,
                        to: contract.address,
                        value,
                    },
                });
            } catch (e) {
                console.error(e);
            }

            that.updateUserDetails();
        });

        document.getElementById('withdraw-btn').addEventListener('click', async function(evt) {
            evt.preventDefault();
            const account = await that.getAccount();

            try {
				const tx = await contract.withdraw({
					...that.transactionParams,
					...{
						from: account,
					},
				});
			} catch (e) {
				console.error(e);
            }

            that.updateUserDetails();
        });

        document.getElementById('claim-clown-btn').addEventListener('click', async function(evt) {
            evt.preventDefault();
            const account = await that.getAccount();

            try {
				const tx = await contract.claimClown({
					...that.transactionParams,
					...{
						from: account,
					},
				});
			} catch (e) {
				console.error(e);
            }

            that.updateContractDetails();
            that.updateUserDetails();
        });



        // update clown tent
        // TODO move this somewhere better
        setInterval(function() {
            document.querySelectorAll('#clown-tent .clown').forEach((clownEl, i) => {
                const clamp = (v) => Math.min(Math.max(v, 30), that.TENT_SIZE-30);

                that.clowns[i].x += ((Math.random() - 0.5) * 10) | 0;
                that.clowns[i].y += ((Math.random() - 0.5) * 10) | 0;
                that.clowns[i].r += (Math.random() - 0.5) * 0.1;

                that.clowns[i].x = clamp(that.clowns[i].x);
                that.clowns[i].y = clamp(that.clowns[i].y);

                if (Math.random() < 0.01) {
                    that.clowns[i].r += (Math.random() - 0.5) * Math.PI;
                }

                clownEl.style.transform = `translate(${that.clowns[i].x}px,${that.clowns[i].y}px) rotate(${that.clowns[i].r}rad)`;
            });
        }, 100);
    },

    toBch:         function (v) { return new BigNumber(v.toString()).dividedBy('1e18'); },
    toClownPoints: function (v) { return this.toBch(v.toString()).multipliedBy(3976); },

    updateUserDetails: async function() {
        const account = await this.getAccount();
        const contract = await this.getContract();

        if (! account) {
            return;
        }

        this.updateElement('metamask-account', account);

        const bch_balance   = await contract.bchBalanceOf(account);
        const clown_balance = await contract.balanceOf(account);
        const clown_points  = await contract.clownPointsOf(account);
        const invested      = await contract.invested(account);

        this.updateElement('bch-balance',   Number.parseFloat(this.toBch(bch_balance.toString()).toFixed(4)));
        this.updateElement('clown-points',  Number.parseFloat(this.toClownPoints(clown_points).toFixed(4)));
        this.updateElement('invested',      Number.parseFloat(this.toBch(invested).toFixed(4)));
        this.updateElement('clown-balance', clown_balance.toString());

        // withdraw pane
        if (new BigNumber(bch_balance).isGreaterThan(0)) {
            this.updateElement('withdraw-message', `You can withdraw <strong>${this.toBch(bch_balance.toString()).toString()} BCH</strong> now`);
            document.getElementById('withdraw-btn').disabled = false;
        } else {
            this.updateElement('withdraw-message', '');
            document.getElementById('withdraw-btn').disabled = true;
        }


        // claim clown area
        const clown_price = await contract.clownPrice();
        const clownPointsBN = new BigNumber(clown_points);
        const clownPriceBN = new BigNumber(clown_price);
        if (clownPointsBN.isGreaterThanOrEqualTo(clownPriceBN)) {
            this.updateElement('need-more-points-message', '');
            this.updateElement('claim-clown-message', `You can claim <strong>${clownPointsBN.dividedBy(clownPriceBN).toNumber() | 0}</strong> 🤡!`);
            document.getElementById('claim-clown-btn').disabled = false;
        } else {
            this.updateElement('need-more-points-message', `You need <strong>${this.toClownPoints(clownPriceBN.minus(clownPointsBN))}</strong> points to claim a clown.`);
            this.updateElement('claim-clowns-message', '');
            document.getElementById('claim-clown-btn').disabled = true;
        }

        const clownCount = (await contract.balanceOf(account)).toNumber();
        for (let i=this.clowns.length; i<clownCount; ++i) {
            const tokenId = (await contract.tokenOfOwnerByIndex(account, i)).toNumber();
            const x = (Math.random() * this.TENT_SIZE) | 0;
            const y = (Math.random() * this.TENT_SIZE) | 0;
            const r = Math.random() * Math.PI * 2;

            const el = document.createElement('span');
            el.classList.add('clown');

            document.getElementById('clown-tent').appendChild(el);
            this.clowns.push({tokenId, x, y, r});
        }
    },

    updateContractDetails: async function() {
        const contract = await this.getContract();
        
        const total_invested = await contract.totalInvested();
        const clown_price    = await contract.clownPrice();
        const total_clowns   = await contract.totalSupply();

        this.updateElement('total-invested', Number.parseFloat(this.toBch(total_invested).toFixed(4)));
        this.updateElement('clown-price',    Number.parseFloat(this.toClownPoints(clown_price).toFixed(4)));
        this.updateElement('total-clowns',   total_clowns.toString());
    },

    claimClown: async function() {
        const account = await this.getAccount();
        const contract = await this.getContract();

        try {
            const tx = await contract.claimClown({
                ...this.transactionParams,
                ...{
                    from: account,
                },
            });

            console.log(tx);
        } catch (e) {
            console.error(e);
        }

    },

    // this can be used for error or information display
    showModal: function(title, content) {
        this.updateElement('modal-title', title);
        this.updateElement('modal-text', content);

        document.querySelector('body').classList.add('modal-open');
    },


    getContract: async function() {
        return this.contracts.InsaneClownPonzi.deployed();
    },


    // this will either get the first account or will request wallet to prompt for access
    // this should be used everywhere that getting an account is needed, in case the
    // wallet becomes disconnected during runtime.
    getAccount: async function() {
        const that = this;

        return new Promise((resolve, reject) => {
            web3.eth.getAccounts(async (error, accounts) => {
                if (error) {
                    reject(error);
                }

                if (accounts.length === 0) {
                    await ethereum.request({ method: 'eth_requestAccounts' });
                    return await that.getAccount();
                }


                resolve(accounts[0]);
            });
        });
    },

    toggleFormDisabled: function(disabled) {
        document.querySelectorAll('button').forEach((el) => el.disabled = disabled);
        document.querySelectorAll('input').forEach((el) => el.disabled = disabled);
    },

    // helper
    updateElement: function(htmlId, innerHTML) {
        const el = document.getElementById(htmlId);
        if (! el) {
            console.warn(`${htmlId} does not exist for updateElement`);
            return;
        }

        el.innerHTML = innerHTML;
    },
};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});

let timer;

document.addEventListener('input', e => {
  const el = e.target;

  if( el.matches('[data-color]') ) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      document.documentElement.style.setProperty(`--color-${el.dataset.color}`, el.value);
    }, 100)
  }
});
