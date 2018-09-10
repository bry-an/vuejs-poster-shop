const price = 9.99;
const loadNum = 10;

var pusher = new Pusher('7a14f8420785af44774d', { //for homework, get server to push these vales when server writes html to client 
    cluster: 'us2',
    encrypted: true
})

new Vue({
    el: '#app',
    data: {
        total: 0,
        items: [
        ],
        cart: [
        ],
        results: [
        ],
        newSearch: 'airplanes',
        lastSearch: '',
        loading: false,
        price,
        pusherUpdate: false
    },
    computed: {
        noMoreItems: function() {
            return this.results.length === this.items.length && this.results.length > 0;

        }
    },
    watch: {
        cart: {
            handler: function(val) {
                if (!this.pusherUpdate) {
                this.$http.post('/cart_update', val); 
                } else {
                    this.pusherUpdate = false;
                }
            },
            deep: true, //watcher will watch anything nested within cart
        }
    },
    methods: {
        appendItems: function () {
            if (this.items.length < this.results.length) {
                var append = this.results.slice(this.items.length, this.items.length + loadNum);
                this.items = this.items.concat(append);
            }

        },
        onSubmit: function () {
            if (this.newSearch.length) {
            this.items = [];
            this.loading = true;
            this.$http
                .get('/search/'.concat(this.newSearch))
                .then(function (res) {
                    console.log(res);
                    this.results = res.data;
                    this.lastSearch = this.newSearch;
                    this.appendItems();
                    this.loading = false;
                });
            }
        },
        addItem: function (index) {
            this.total += price;
            var item = this.items[index];
            var found = false;
            this.cart.forEach(function (cartItem) {
                if (cartItem.id === item.id) {
                    cartItem.qty++;
                    found = true;
                }
            });
            if (!found) {
                this.cart.push({
                    id: item.id,
                    title: item.title,
                    qty: 1,
                    price: 9.99
                });
            }
        },
        inc: function (item) {
            this.total += price;
            item.qty++;

        },
        dec: function (item) {
            this.total -= price;
            item.qty--;
            if (item.qty <= 0) {
                for (var i = 0; i < this.cart.length; i++) {
                    if (this.cart[i].id === item.id)
                        this.cart.splice(i, 1);
                    break;
                }
            }

        },

    },
    filters: {
        currency: price => '$'.concat(price.toFixed(2))

    },

    mounted: function () {
        var vueInstance = this;
        this.onSubmit();
        var elem = document.getElementById('product-list-bottom');
        var watcher = scrollMonitor.create(elem);
        watcher.enterViewport(function () {
            vueInstance.appendItems();
        });

        var channel = pusher.subscribe('cart');
        channel.bind('update', function(data) {
            vueInstance.pusherUpdate = true;
            vueInstance.cart = data;
            vueInstance.total = 0;
            for (var i = 0; i < vueInstance.cart.length; i++ ) {
                vueInstance.total += price * vueInstance.cart[i].qty;
            }
        }) //execute custom logic based on different events
    }
})