const App = {
    web3Provider: null,
    contract: null,
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

        this.contract = await InsaneClownPonzi.deployed();

        const that = this;
        // provide live update checking of selected network
        let lastNetworkId = null;
        setInterval(async function() {
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
        }, 1000);

        return this.bindEvents();
    },

    // set up base page to listen to events
    bindEvents: function() {
        const that = this;

        document.querySelector('#modal-close').addEventListener('click', function() {
            document.querySelector('body').classList.remove('modal-open');
        });

        document.getElementById('connect-to-wallet').addEventListener('click', async function(evt) {
            evt.preventDefault();
            this.updateDetails();
        });

        document.getElementById('withdraw-btn').addEventListener('click', async function(evt) {
            evt.preventDefault();
            this.updateDetails();

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
        });
    },

    updateDetails: async function() {
        const account = await this.getAccount();
        if (account) {
            document.getElementById('metamask-account').innerHTML = account;
            document.getElementById('account-balance').innerHTML = this.contract.balanceOf(account);
        }
    },

    // this can be used for error or information display
    showModal: function(title, content) {
        document.getElementById('modal-title').innerHTML = title;
        document.getElementById('modal-text').innerHTML = content;

        document.querySelector('body').classList.add('modal-open');
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
};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
