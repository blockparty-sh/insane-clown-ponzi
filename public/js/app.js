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

        // HEADER ITEMS
        document.getElementById('help-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            that.showModal('Help', `<div class="scrollable-wrapper">
                <h2>Introduction / What is a Ponzi?</h2>
                <p>Hello and welcome to Insane Clown Ponzi, the first Ponzi DeFI NFT dApp on smartBCH.</p>

                <h2>How do I make money with this?</h2>
                <p>You must deposit BCH, at this point the BCH is distributed to all others who have invested in the ponzi before you. Also, a 10% fee is applied, of which 5% is distributed amongst all 🤡 and the other 5% is sent to the first who invested in the ponzi.</p>

                <p>When others invest in the Ponzi scheme, you will receive a cut of their deposit proportional to your investment in the Ponzi compared to the total Ponzi size, as well as 🧠. This provides an incentive for you to convince others that this is a good idea. Your balance can be withdrawn at any time by clicking the "WITHDRAW" button. There is no minimum to withdraw, and this will not affect your 🧠.</p>

                <p>Once you save enough brain you can start claiming 🤡. The 🤡 will appear in your tent and start dancing. The 🤡 receive 50% of the fees, so if you want to make the most money you will want to claim your 🤡 right away. Another added benefit, is that by the introduction of a collectible NFT into this Ponzi scheme, it allows others to speculate on the ponzi scheme's fees without actually investing in the Ponzi scheme itself, only by buying 🤡 on the secondary market. This innovation is only possible with really smart contracts.</p>

                <h2>Interface</h2>
                <p></p>

                <h2>Clown Bonding Curve</h2>
                <p>Clown supply is limited by the amount of 🧠 one is able to acquire, and the price of 🤡 increases by 1/2021 each time one is purchased. </p>

                <h2>Buying Clowns</h2>
                <h2>Selling Clowns</h2>
            </div>`);
        });

        const player = document.getElementById('bg-audio-player');
        if (player.paused) {
            document.getElementById('audio-item').innerHTML = '🔇';
        }
        document.getElementById('audio-item').addEventListener('click', async function(evt) {
            evt.preventDefault();

            if (player.paused) {
                document.getElementById('audio-item').innerHTML = '🔈';
                player.play();
            } else {
                document.getElementById('audio-item').innerHTML = '🔇';
                player.pause();
            }
        });

        document.getElementById('source-code-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            that.showModal('Source Code', `
                <a href="https://github.com/blockparty-sh/insane-clown-ponzi">Source Code</a>
            `);
        });
        document.getElementById('bch-balance-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            that.showModal('Earnings', 'llaalalala');
        });

        document.getElementById('invested-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            that.showModal('Invested', 'llaalalala');
        });

        document.getElementById('clown-points-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            that.showModal('Brain Power', 'llaalalala');
        });

        document.getElementById('clown-balance-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            let html = '<div class="scrollable-wrapper">';
            that.clowns.forEach((clown) => {
                html += `
                    <div class="scrollable-row">
                        <div class="scrollable-col">
                            <span class="clown-name">${clown.name}</span><br>
                            <span class="clown-quote">${clown.quote}</span>
                        </div>
                        <div class="scrollable-col align-right">
                            <object type="image/svg+xml" data="img/clown.svg" class="clown-image" data-clown-id="${clown.tokenId}"></object>
                        </div>
                    </div>`;
            });
            html += '</table></div>';
            that.showModal('Your 🤡 Collection', html);

            that.clowns.forEach((clown) => {
                const el = document.querySelector(`.clown-image[data-clown-id="${clown.tokenId}"]`);

                el.addEventListener('load', function() {
                    const s = el.contentDocument;

                    const m = [
                        {sel: '.st53', key: 'hair'},
                        {sel: '.st56', key: 'eye'},
                        {sel: '.st54', key: 'face'},
                        {sel: '.st39', key: 'forehead'},
                        {sel: '.st24', key: 'face_shadow'},
                        {sel: '.st55', key: 'blush'},
                        {sel: '.st15', key: 'nose_lip'},
                        {sel: '.st16', key: 'upper_nose_lip'},
                    ];

                    for (let o of m) {
                        s.querySelectorAll(o.sel).forEach((g) => {
                            g.style.fill = clown.colors[o.key];
                        });
                    }
                });
            });
        });

        // FORM BUTTONS
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

            const info = Clown.getInfo(tokenId);
            const name = info.name;
            const quote = info.quote;
            const colors = info.colors;

            const el = document.createElement('span');
            el.classList.add('clown');

            document.getElementById('clown-tent').appendChild(el);
            this.clowns.push({tokenId, x, y, r, name, quote, colors});
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
