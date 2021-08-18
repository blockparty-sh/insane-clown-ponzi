const App = {
    web3Provider: null,
    contracts: {},
    transactionParams: {
        gasPrice: "1050000000", // 10 gwei
    },

    init: async function() {
        if (typeof web3 === 'undefined') {
            this.showModal('Install MetaMask', `
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

        // detect Network account change
        window.ethereum.on('networkChanged', (networkId) => {
            checkNetwork();
        });

        await this.bindEvents();
        this.updateContractDetails();
    },

    // set up base page to listen to events
    bindEvents: async function() {
        const that = this;

        const contract = await this.getContract();

        document.querySelector('#modal-close').addEventListener('click', function() {
            document.querySelector('body').classList.remove('modal-open');
        });

        document.getElementById('connect-to-wallet').addEventListener('click', async function(evt) {
            evt.preventDefault();
            that.updateUserDetails();
        });

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

            try {
                /*
				const tx = await contract.withdraw(address, amount, {
					...that.transactionParams,
					...{
						from: account,
					},
				});
                */
			} catch (e) {
				console.error(e);
            }

            that.updateUserDetails();
        });
    },

    toBch:         function (v) { return new BigNumber(v.toString()).dividedBy('1e18'); },
    toClownPoints: function (v) { return this.toBch(v.toString()).multipliedBy(3976); },

    updateUserDetails: async function() {
        const account = await this.getAccount();
        const contract = await this.getContract();

        if (account) {
            this.updateElement('metamask-account', account);

            const bch_balance   = await contract.bchBalanceOf(account);
            const clown_balance = await contract.balanceOf(account);
            const clown_points  = await contract.clownPointsOf(account);
            const invested      = await contract.invested(account);

            this.updateElement('bch-balance',   this.toBch(bch_balance.toString()).toString());
            this.updateElement('clown-points',  this.toClownPoints(clown_points).toString());
            this.updateElement('invested',      this.toBch(invested).toString());
            this.updateElement('clown-balance', clown_balance.toString());

            // TODO add clowns to pen
            const clowns = [];
            const clownCount = await contract.balanceOf(account);
            for (let i=0; i<clownCount; ++i) {
                console.log('clown index', await contract.tokenOfOwnerByIndex(account, i));
            }
        }
    },

    updateContractDetails: async function() {
        const contract = await this.getContract();
        
        const total_invested = await contract.totalInvested();
        const clown_price    = await contract.clownPrice();
        const total_clowns   = await contract.totalSupply();

        this.updateElement('total-invested', this.toBch(total_invested).toString());
        this.updateElement('clown-price',    this.toClownPoints(clown_price).toString());
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
