const App = {
    web3Provider: null,
    contracts: {},
    transactionParams: {
        gasPrice: "1050000000", // 10 gwei
    },
    clowns: [],
    TENT_SIZE: 400,

    // this should be run right away
    initPlayer: async function() {
        const player = document.getElementById('bg-audio-player');
        if (localStorage.getItem('audio-play') === "false") {
            player.pause();
        }
        if (localStorage.getItem('audio-play') === "true") {
            player.play();
        }
        if (player.paused) {
            document.getElementById('audio-item').innerHTML = '🔇';
        }
        document.getElementById('audio-item').addEventListener('click', async function(evt) {
            evt.preventDefault();

            if (player.paused) {
                document.getElementById('audio-item').innerHTML = '🔈';
                player.play();
                localStorage.setItem('audio-play', true);
            } else {
                document.getElementById('audio-item').innerHTML = '🔇';
                player.pause();
                localStorage.setItem('audio-play', false);
            }
        });
    },

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

        if (window.ethereum) {
            // detect Network account change
            window.ethereum.on('chainChanged', (networkId) => {
                window.location.reload();
            });

            window.ethereum.on('accountsChanged', (networkId) => {
                window.location.reload();
            });
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

        if (window.ethereum) {
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
        }

        // HEADER ITEMS
        document.getElementById('help-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            that.showModal('Help', `<div class="scrollable-wrapper">
                <h3>Introduction / What is a Ponzi?</h3>
                <p>Hello and welcome to Insane Clown Ponzi, the first Ponzi DeFI NFT dApp on smartBCH. A "Ponzi" is an advanced financial technique in which your deposits pay past investors, and future investors pay you. This can lead to GIGANTIC gains if you are able to invest before others do, however all money you deposit is effectively immediately gone.</p>

                <h3>How do I make money with this?</h3>
                <p>You must deposit BCH, at this point the BCH is distributed to all others who have invested in the Ponzi before you. a 10% fee is applied, of which 5% is distributed amongst all 🤡 and the other 5% is sent to the first who invested in the ponzi.</p>

                <p>When others invest in the Ponzi scheme, you will receive a cut of their deposit proportional to your investment in the Ponzi compared to the total Ponzi size, as well as 🧠. This provides an incentive for you to convince others that this is a good idea. Your balance can be withdrawn at any time by clicking the "WITHDRAW" button. There is no minimum to withdraw, and this will not affect your 🧠.</p>

                <p>Once you save enough brain you can start claiming 🤡. The 🤡 will appear in your tent and start dancing. The 🤡 receive 50% of the fees, so if you want to make the most money you will want to claim your 🤡 right away. Another added benefit, is that by the introduction of a collectible NFT into this Ponzi scheme, it allows others to speculate on the ponzi scheme's fees without actually investing in the Ponzi scheme itself, only by buying 🤡 on the secondary market. This innovation is only possible with really smart contracts.</p>

                <h3>🤡 Features</h3> 
                <p>As stated above, 🤡 enable you to receive fees from future investments. But, that's not all. 🤡 also each have their own unique design, name, and they come with a unique motivational quote. In addition, you can watch all of your 🤡 dance in the circus tent on the homepage. They are happy now.</p>

                <h3>🤡 Bonding Curve</h3>
                <p>🤡 supply is limited by the amount of 🧠 one is able to acquire, and the price of 🤡 increases by 1/2021 each time one is purchased. This is known as a bonding curve and is a pillar of 21st century mathematics. You can calculate future 🤡 prices by this formula 0.01 * ((1 + 1/2021) ** i) where 0.01 is referring to the price in BCH of the first 🤡 and i is the index of the next 🤡 to purchase. </p>

                <h3>Secondary 🤡 Market</h3>
                <h4>Buying 🤡</h4>
                <p>You may think this is a great idea, but you do not want to invest in a Ponzi scheme, however, you do want to speculate on the future investments into the Ponzi scheme. This is what tokenizing 🤡 enables. You may want to purchase 🤡 from others in order to receive the fees they receive, or you may want to part with your 🤡 in order to invest more in the Ponzi. The possibilities are endless.</p>

                <h4>Selling 🤡</h4>
                <p>Currently there is not an NFT marketplace on smartBCH. However, one can trade in a p2p fashion via Telegram or something similar. You can click on the 🤡 symbol in the header and then click on the name of the 🤡 you want to sell. This will show you a panel that allows you to transfer a 🤡 to another address. Be sure to check the address is correct.</p>
            </div>`);
        });

        document.getElementById('source-code-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            that.showModal('Source Code', `
                Insane Clown Ponzi is Open Source, so if you want to see how it works, or improve it in some way please come and check it out.
                <a href="https://github.com/blockparty-sh/insane-clown-ponzi">Source Code</a>
            `);
        });
        document.getElementById('bch-balance-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            that.showModal('Earnings', 'These are your earnings which are available for withdrawal. Ideally you will eventually be able to withdraw more than you put in initially, however this may not happen if people stop investing in the Ponzi scheme. This number could be theoretically all Bitcoin Cash ever mined if people put all of their money into Insane Clown Ponzi forever.');
        });

        document.getElementById('invested-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            that.showModal('Invested', `This is the total size of the Ponzi that you have invested. Compare this with the total size of the Ponzi in the 🌍 Stats pane to get an idea of how big of a slice of the pool you have.`);
        });

        document.getElementById('clown-points-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            that.showModal('Brain Power', 'You gain Brain Power 🧠 every time someone invests in Insane Clown Ponzi after you. It can be used to buy 🤡. The 🤡 price rises every time someone purchases one, so make sure you buy them as soon as you can for maximum efficiency. 50% of all fees are sent to owners of 🤡.');
        });

        document.getElementById('clown-balance-item').addEventListener('click', async function(evt) {
            evt.preventDefault();
            let html = '';

            if (that.clowns.length === 0) {
                html = `Oh no.. you don't have any 🤡 yet. You need to invest in Insane Clown Ponzi, then wait for others to invest. You'll see your 🧠 increasing, then you can claim a 🤡 when you have enough. Come back soon!`;
            } else {
                html += '<div class="scrollable-wrapper">';
                that.clowns.forEach((clown) => {
                    html += `
                        <div class="scrollable-row" data-clown-id="${clown.tokenId}">
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
            }
            that.showModal('Your 🤡 Collection', html);

            document.querySelectorAll('#modal .scrollable-row').forEach((el) => {
                el.addEventListener('click', function() {
                    window.location.href = `clown.html?tokenId=${el.dataset.clownId}`;
                });
            });

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
    },

    // for index.html
    initMainApp: async function() {
        const that = this;
        const contract = await this.getContract();

        // FORM BUTTONS
        document.getElementById('deposit-btn').addEventListener('click', async function(evt) {
            evt.preventDefault();

            if (document.getElementById('deposit-btn').classList.contains('btn-disabled')) {
                return;
            }

            if (! window.hasOwnProperty('ethereum')) {
                return;
            }

            if (Number.parseFloat(document.getElementById('deposit-amount').value || 0) < 0.001) {
                that.showModal('Error: Too small of deposit', 'The minimum deposit size is 0.001 BCH');
                return;
            }

            const from = await that.getAccount();

            const invested = await contract.invested(from);
            const firstDeposit = ! (new BigNumber(invested).isGreaterThan(0));

            const value = new BigNumber(document.getElementById('deposit-amount').value)
                .multipliedBy(new BigNumber('1e18'))
                .toFixed();

            Array.from(document.getElementsByClassName('btn-wrapper')).forEach((el) => el.classList.add('btn-disabled'));
            let tx = null;
			try {
                tx = await web3.eth.sendTransaction({
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

            if (tx && firstDeposit) {
                that.showModal('Great, you made your first deposit!', `
                    This is great, it increased the size of the Ponzi, paid all of the past investors in BCH and 🧠, and rewarded the 🤡 too.<br>
                    NICE WORK!<br>
                    Now, you can decide to wait, or add more. Hopefully after not too long you can get your first 🤡!
                `);
            }

            document.getElementById('deposit-amount').value = '';

            that.updateUserDetails();
            that.updateContractDetails();
        });

        document.getElementById('withdraw-btn').addEventListener('click', async function(evt) {
            evt.preventDefault();

            if (document.getElementById('withdraw-btn').classList.contains('btn-disabled')) {
                return;
            }

            const account = await that.getAccount();

            const bch_balance = await contract.bchBalanceOf(account);
            if (! new BigNumber(bch_balance).isGreaterThan(0)) {
                return;
            }

            Array.from(document.getElementsByClassName('btn-wrapper')).forEach((el) => el.classList.add('btn-disabled'));
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

            if (document.getElementById('claim-clown-btn').classList.contains('btn-disabled')) {
                return;
            }

            const account = await that.getAccount();

            // TODO clean up
            const clown_points  = await contract.clownPointsOf(account);
            const clown_price = await contract.clownPrice();
            const clownPointsBN = new BigNumber(clown_points);
            const clownPriceBN = new BigNumber(clown_price);
            if (clownPointsBN.isLessThan(clownPriceBN)) {
                return;
            }

            Array.from(document.getElementsByClassName('btn-wrapper')).forEach((el) => el.classList.add('btn-disabled'));
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
            that.updateUserDetails(true);
        });

        document.getElementById('claim-all-clowns-btn').addEventListener('click', async function(evt) {
            evt.preventDefault();

            if (document.getElementById('claim-all-clowns-btn').classList.contains('btn-disabled')) {
                return;
            }

            const account = await that.getAccount();

            // TODO clean up
            const clown_points  = await contract.clownPointsOf(account);
            const clown_price = await contract.clownPrice();
            const clownPointsBN = new BigNumber(clown_points);
            const clownPriceBN = new BigNumber(clown_price);
            if (clownPointsBN.isLessThan(clownPriceBN)) {
                return;
            }

            Array.from(document.getElementsByClassName('btn-wrapper')).forEach((el) => el.classList.add('btn-disabled'));
            try {
				const tx = await contract.claimAllClowns({
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

                if (Math.random() < 0.001 / (that.clowns.length / 2)) {
                    that.clowns[i].r += (Math.random() - 0.5) * Math.PI;

                    const sayings = [
                        'GOT YOUR NOSE',
                        'HONK HONK',
                        'BOO',
                        'GESUNDHEIT',
                        '**SQUEAKY SQUEAKY**',
                        'CATCH',
                        'WHATDYA SAY?',
                        'AYYYYYYYYE!',
                        'FUGGETABOUTIT',
                    ];
                    clownEl.dataset.text = sayings[(Math.random() * sayings.length) | 0];
                    clownEl.classList.add('showText');

                    setTimeout(() => {
                        clownEl.classList.remove('showText');
                    }, 2000+ (Math.random() * 2000));
                }


                clownEl.style.transform = `translate(${that.clowns[i].x}px,${that.clowns[i].y}px) rotate(${that.clowns[i].r}rad)`;
            });
        }, 100);
    },

    // for clown.html
    initClownApp: async function() {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlSearchParams.entries());

        const tokenId = Number.parseInt(params.tokenId);

        const info = Clown.getInfo(tokenId);
        const name = info.name;
        const quote = info.quote;
        const colors = info.colors;

        const contract = await this.getContract();
        const owner = await contract.ownerOf(tokenId);

        const that = this;

        let ownedByYou = false;
        if (window.ethereum && window.ethereum.isConnected()) {
            const account = await this.getAccount();
            if (owner === account) {
                ownedByYou = true;
                document.getElementById('transfer-clown-pane').style.display = 'block';

                document.getElementById('transfer-btn').addEventListener('click', async function(evt) {
                    evt.preventDefault();

                    if (document.getElementById('transfer-btn').classList.contains('btn-disabled')) {
                        return;
                    }

                    const to = document.getElementById('transfer-address').value.trim();

                    Array.from(document.getElementsByClassName('btn-wrapper')).forEach((el) => el.classList.add('btn-disabled'));
                    let tx = null;
                    try {
                        tx = await contract.transfer(to, tokenId, {
                            ...that.transactionParams,
                            ...{
                                from: account,
                            },
                        });
                    } catch (e) {
                        console.error(e);
                        if (e.toString().startsWith('Error: invalid address')) {
                            that.showModal('Error: Invalid Address', 'Double check the address is correct and try again');
                        }
                    }

                    if (tx) {
                        console.log(tx);
                        that.showModal(`🤡 ${name} Transferred Successfully`, `
                            Oh how everything can change in the blink of an eye.<br>
                            Goodbye dear friend ${name}.<br>
                            <br>
                            ${quote}
                            <br>
                            <br>
                            <a href="https://www.smartscan.cash/transaction/${tx.tx}">View TX on Explorer</a>
                        `);
                    }
                });
            }
        }

        if (! ownedByYou) {
            document.getElementById('clown-owner-pane').style.display = 'block';
            this.updateElement('owner-address', `<a href="https://smartscan.cash/address/${owner}">${owner}</a>`);
        }

        this.updateElement('full-clown-name', name);
        this.updateElement('full-clown-quote', quote);

        const el = document.getElementById('full-clown-image');
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
                g.style.fill = colors[o.key];
            });
        }
    },

    toBch:         function (v) { return new BigNumber(v.toString()).dividedBy('1e18'); },
    toClownPoints: function (v) { return this.toBch(v.toString()).multipliedBy(3976); },

    updateUserDetails: async function(showNewClown = false) {
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

        if (document.getElementById('deposit-pane')) {
            if (new BigNumber(invested).isGreaterThan(0)) {
                this.updateElement('deposit-msg',  'Depositing more BCH into the Ponzi scheme will allow you to get a larger %');
                document.getElementById('deposit-pane').querySelector('.card').classList.remove('pulser');
            } else {
                document.getElementById('deposit-pane').querySelector('.card').classList.add('pulser');
            }
        }

        this.updateElement('bch-balance',   Number.parseFloat(this.toBch(bch_balance.toString()).toFixed(4)));
        this.updateElement('clown-points',  Number.parseFloat(this.toClownPoints(clown_points).toFixed(4)));
        this.updateElement('invested',      Number.parseFloat(this.toBch(invested).toFixed(4)));
        this.updateElement('clown-balance', clown_balance.toString());


        // deposit pane
        if (document.getElementById('deposit-pane')) {
            if (window.hasOwnProperty('ethereum')) {
                document.getElementById('deposit-btn').classList.remove('btn-disabled');
                document.getElementById('deposit-amount').disabled = false;
            }
        }

        // withdraw pane
        if (document.getElementById('withdraw-pane')) {
            if (new BigNumber(bch_balance).isGreaterThan(0)) {
                this.updateElement('withdraw-message', `You can withdraw <strong>${Number.parseFloat(this.toBch(bch_balance.toString())).toFixed(4)} BCH</strong> now`);
                document.getElementById('withdraw-btn').classList.remove('btn-disabled');
            } else {
                this.updateElement('withdraw-message', '');
                document.getElementById('withdraw-btn').classList.add('btn-disabled');
            }
        }

        // claim clown area
        if (document.getElementById('claim-clown-pane')) {
            const clown_price = await contract.clownPrice();
            const clownPointsBN = new BigNumber(clown_points);
            const clownPriceBN = new BigNumber(clown_price);
            if (clownPointsBN.isGreaterThanOrEqualTo(clownPriceBN)) {
                this.updateElement('need-more-points-message', '');
                this.updateElement('claim-clown-message', `You can claim <strong>${clownPointsBN.dividedBy(clownPriceBN).toNumber() | 0}</strong> 🤡!`);
                document.getElementById('claim-clown-btn').classList.remove('btn-disabled');
                document.getElementById('claim-all-clowns-btn').classList.remove('btn-disabled');
                document.getElementById('claim-clown-pane').querySelector('.card').classList.add('pulser');
            } else {
                this.updateElement('need-more-points-message', `You need an additional <strong>${Number.parseFloat(this.toClownPoints(clownPriceBN.minus(clownPointsBN))).toFixed(4)}</strong> 🧠 to claim a 🤡.`);
                this.updateElement('claim-clown-message', '');
                document.getElementById('claim-clown-btn').classList.add('btn-disabled');
                document.getElementById('claim-all-clowns-btn').classList.add('btn-disabled');
                document.getElementById('claim-clown-pane').querySelector('.card').classList.remove('pulser');
            }
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

            if (document.getElementById('clown-tent')) {
                const el = document.createElement('span');
                el.classList.add('clown');
                el.dataset.text = name;

                document.getElementById('clown-tent').appendChild(el);
            }

            this.clowns.push({tokenId, x, y, r, name, quote, colors});

            if (showNewClown) {
                this.showModal('New 🤡 Received', `
                    <span class="clown-name">${name}</span><br>
                    <span class="clown-quote">${quote}</span><br>
                    <object type="image/svg+xml" data="img/clown.svg" id="new-clown-image"></object>
                `);

                const el = document.querySelector('#new-clown-image');

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
                            g.style.fill = colors[o.key];
                        });
                    }
                });
            }
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
