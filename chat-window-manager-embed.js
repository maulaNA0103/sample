class LinkedHashMap {
    constructor() {
        this.map = {};
        this.keys = []
    }

    put(key, value) {
        if (!this.map.hasOwnProperty(key)) {
            this.keys.push(key);
        }
        this.map[key] = value;
    }

    get(key) {
        return this.map[key];
    }

    
    delete(key) {
        const index = this.keys.indexOf(key);
        if (index !== -1) {
            this.keys.splice(index, 1);
            delete this.map[key];
        }
    }
    
    contains(key) {
        return typeof this.get(key) !== 'undefined' && this.get(key) != null;
    }

    keys() {
        return this.keys;
    }

    values() {
        return this.keys.map(key => this.map[key]);
    }

    size() {
        return this.keys.length;
    }

    clear() {
        this.map = {};
        this.keys = [];
    }

    forEach(callback) {
        this.keys.forEach(key => {
            callback(key, this.map[key]);
        });
    }

    first() {
        if (this.keys.length === 0) {
            return null;
        }
        const firstKey = this.keys[0];
        return { key: firstKey, value: this.map[firstKey] };
    }

    last() {
        if (this.keys.length === 0) {
            return null;
        }
        const lastKey = this.keys[this.keys.length - 1];
        return { key: lastKey, value: this.map[lastKey] };
    }
}

const ChatWindowManager = (function() {
    let _height, _width, _agent, _initialPosition, _maxWindows, _paddingX, _paddingY, _parent, _server, _wssServer, _token;
    const _windows = new LinkedHashMap();
    const VERSION = "/apiv1";
    const PREFIX = `${VERSION}/graph`;
    const POST_AUTH = `${PREFIX}/auth`;
    const POST_REFRESH_TOKEN = `${PREFIX}/auth/refreshToken`;
    const GET_LOGIN = `${PREFIX}/auth/login`;

    //DEBUG
    const dummyTicket = {
        number: "1",
        status: "Open",
        channel: {
            name: "Livechat",
            iconUrl: "https://venom.3dolphins.ai:9443/dolphin/javax.faces.resource/images/channel/ic_webchat.png.xhtml?ln=avalon-layout&v=240502",
        },
        contact: {
            id: "1234567890",
            name: "Veldanava",
            profileUrl: "https://64.media.tumblr.com/cc9d46522e415b37f1799bc282332404/49eb85a811162db9-09/s1280x1920/5b3c8c68bb9371bd1dccd5250d6cd1c2c0625cc8.jpg",
        },
    }
    
    const dummyAgent = {
        name: "R"
    }

    const dummyMessages= [
        {
            "agent": false,
            "message": "Halo sample message dari customer",
            "timestamp": new Date() - (getRandomNumber(4 * 60 * 60, 5 * 60 * 60) * 10000)
        },{
            "agent": false,
            "message": "Ini dummy message ke #2",
            "timestamp": new Date() - (getRandomNumber(3 * 60 * 60, 4 * 60 * 60) * 10000)
        },{
            "agent": true,
            "sender": "Bot",
            "message": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam a elit vel nulla cursus interdum vitae non nulla. Sed vitae sapien ut eros suscipit sollicitudin. Nunc faucibus congue felis, ac tempor dui aliquam ut. Duis sit amet convallis quam, sit amet bibendum magna. Integer eu placerat tellus. Ut iaculis risus massa, posuere tincidunt felis convallis id. Donec viverra luctus facilisis. Curabitur ex libero, molestie eget odio quis, interdum finibus ligula. In eleifend at nisi vel bibendum.",
            "timestamp": new Date() - (getRandomNumber(2 * 60 * 60, 3 * 60 * 60) * 10000)
        },{
            "agent": false,
            "message": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam tristique, ligula gravida tempor tempus, est enim tristique mi, a tincidunt orci sem interdum arcu. Pellentesque leo nisi, venenatis sit amet velit id, lacinia volutpat erat. Curabitur vitae leo porta, sollicitudin sem quis, hendrerit felis. Donec in sodales metus. Sed vel libero mi. Nulla quam lacus, tincidunt et laoreet vitae, auctor id augue. Nam eget finibus dui. Sed sit amet dolor ut odio hendrerit dictum vel a risus. Maecenas commodo porta est, ac sagittis risus porttitor a. Vivamus dapibus congue luctus. Curabitur et felis ex. Maecenas sit amet arcu ligula. Pellentesque at elit tellus. Ut velit lorem, imperdiet et metus vel, euismod finibus nisi.",
            "timestamp": new Date() - (getRandomNumber(1 * 60 * 60, 2 * 60 * 60) * 10000)
        },{
            "agent": true,
            "sender": "Some Agent - Operator",
            "message": "Sample saja",
            "timestamp": new Date() - (getRandomNumber(0 * 60 * 60, 1 * 60 * 60) * 10000)
        }
    ]

    //DEBUG
    function getRandomNumber(x, y) {
        const min = Math.min(x, y);
        const max = Math.max(x, y);
    
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function print(str)  {
        console.log(str);
    }

    function call(url, headers, callback_success, callback_fail, method = 'GET', timeout = 30000) {
        const xhr = new XMLHttpRequest();
    
        const timer = setTimeout(() => {
            xhr.abort();
            callback_fail(new Error('Request timed out'));
        }, timeout);
    
        xhr.open(method, url, true);

        for (const key in headers) {
            if (headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, headers[key]);
            }
        }
    
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                clearTimeout(timer);
                if (xhr.status >= 200 && xhr.status < 300) {
                    callback_success(xhr.responseText);
                } else {
                    callback_fail(new Error(`Request failed with status ${xhr.status}`));
                }
            }
        };
    
        xhr.onerror = () => {
            clearTimeout(timer);
            callback_fail(new Error('Request failed'));
        };
    
        xhr.send();
    }

    function bringWindowToFront(id, glow) {
        const obj = $(id);
        const active = obj.hasClass('active');
        $('.chat.active').removeClass('active');
        obj.addClass('active');
        if (!active && glow) {
            $('.glow').removeClass('glow');
            obj.addClass('glow');
            setTimeout(function() {
                obj.removeClass('glow');
            }, 500);
        }
    }

    function getPosition(idx = _windows.size()) {
        let descX, descY;
        let positionX = _paddingX + (idx * (_width + _paddingX));
        let positionY = _paddingY;

        descX = (_initialPosition.includes('right')) ? 'right' : 'left';
        descY = (_initialPosition.includes('upper')) ? 'top' : 'bottom';
                
        return {descX: descX, descY: descY, x: positionX, y: positionY};
    }

    function addMessages(ticketNumber, messages) {
        const chat = _windows.get(ticketNumber);
        if (typeof chat !== "undefined") {
            chat.addMessages(messages)
        } 
    }

    function init(obj) {
        addNotificationPage(obj);
    }

    /**
     * Additional page
     */
    function addNotificationPage(obj) {
        const div = `
        <div class="notification">
            <div class="counter">
                <span>1</span>
            </div>
            <i class="fa fa-comments"></i>
        </div>`;
        $(_parent).append(div);
        $(_parent + " .notification").on('click', function() {onOpen(obj)})
    }

    /**
     * Listener
     */
    function onOpen(obj) {
        let activeTicket = obj.activeTicket;
        if (typeof activeTicket !== 'undefined') {
            //Get tickets
            //Open window as loading
            //Close loader on finish
            
            //DEBUG
            $(_parent + " .notification").hide();
            displayWindow();
            obj.addWindow(dummyTicket, dummyMessages);
        }
    }

    function onCloseWindow(obj) {
        $(_parent + " .notification").show();
        displayIcon();
    }

    class ChatWindowManager {
        constructor(config) {
            this.config = config;
            _parent = config.parent;
            _server = config.server;
            _wssServer = config.wssServer;
            _paddingY = config.padding || 32;
            _paddingX = config.padding || 32;
            _width = config.width || 380;
            _height = config.height || 540;
            _initialPosition = config.initialPosition || 'lower-right';
            _maxWindows = Math.floor($(window).width() / _width);

            this.config.width = _width;
            this.config.height = _height;
            this.activeTicket = 'dummy';

            if (config.additionalPadding) {
                _paddingX += 48;
            }
        }

        connect(user, pass) {
            print(`connecting to ${_server} for account ${user}`);
            _agent = dummyAgent;
            init(this);
        }

        addWindow(ticket, messages) {
            if (_windows.contains(ticket.number)) {
                return;
            }
            const chat = new ChatWindow(this,  _agent, ticket, this.config);
            let position = getPosition();
            
            let chatId = chat.create(position);
            _windows.put(ticket.number, chat);
            
            if (_windows.size() > _maxWindows) {
                console.log(`Minimizing least opened windows ${_windows.first().value.id}`)
                chat.show();
            } else {
                chat.show();
            }

            $(chatId).click(function() {
                bringWindowToFront(chatId, true);
            });
            $(chatId).on('dragstart', function(event) {
                bringWindowToFront(chatId, true);
            });

            addMessages(ticket.number, messages);
        }

        repositionWindows() {
            let idx = 0;
            _windows.forEach((key, value) => {
                const position = getPosition(idx);
                $(value.windowId).css('inset', '');
                $(value.windowId).css(position.descX, position.x);
                $(value.windowId).css(position.descY, position.y);
                idx++;
            });
        }

        close(ticketNumber) {
            console.log(`Closing chat window: ${ticketNumber}`)
            _windows.delete(ticketNumber);
            this.repositionWindows();
            onCloseWindow(this);
        }

        get() {
            return _windows;
        }
    }

    return ChatWindowManager;
})();