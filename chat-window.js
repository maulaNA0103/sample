const ChatWindow = (function() {
    const enterToSend = false;
    const disableAnim = true;
    let _mgr;

    /** Utilities */
    function formatTimestamp(timestamp, forceFullLength = false) {
        const now = new Date();
        const timeDifference = now - new Date(timestamp);
    
        const seconds = Math.floor(timeDifference / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
    
        if (!forceFullLength && seconds < 5) {
            return `a moment ago`;
        } else  if (!forceFullLength && seconds < 60) {
            return `${seconds} seconds ago`;
        } else if (!forceFullLength && minutes < 60) {
            return `${minutes} minutes ago`;
        } else if (!forceFullLength && hours < 24) {
            return `${hours} hours ago`;
        } else {
            const date = new Date(timestamp);
            const day = String(date.getDate()).padStart(2, '0');
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
    
            return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
        }
    }

    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }
    
    function nl2br(str) {
        return str.replace(/\n/g, '<br/>');
    }

    function scrollToBottom(obj, timeout = 100) {
        if (disableAnim)  {
            $(obj.chatWindowId + " .content").scrollTop($(obj.chatWindowId + " .content").prop("scrollHeight"));
        } else {
            setTimeout(() => {
                $(obj.chatWindowId + " .content").animate({ scrollTop: $(obj.chatWindowId + " .content").prop("scrollHeight") }, 'fast');
            }, timeout);
        }
    }

    function evaluateTimestamp(obj)  {
        $(obj.chatWindowId + " .timestamp").each(function () {
            const timestamp = $(this).data("value");
            $(this).text(formatTimestamp(timestamp));
        });
    }
    
    /** Listeners */
    function onClose(obj) {
        $(obj.chatWindowId).remove();
        _mgr.close(obj.ticket.number);
    }

    function onMinimize(obj) {
        console.log(`Minimizing window chat ${obj.chatWindowId}`);
        $(obj.chatWindowId).addClass("minimized")
    }

    function onOpen(obj) {
        console.log(`Opening window chat ${obj.chatWindowId}`);
        $(obj.chatWindowId).removeClass("minimized")
    }

    function onTyping(obj) {
        $(obj.input).height(0);
        const sh = $(obj.input)[0].scrollHeight;
        $(obj.input).height(Math.min(sh, 500));
        const l = $(obj.input).val().length;

        if (l > 0) {
            $(obj.chatWindowId + " .message-count-char").text(`${l} character` + (l > 1 ? 's' : ''));
        }  else {
            $(obj.chatWindowId + " .message-count-char").text("");
        }
    }

    function onSendMessage(obj, message) {
        if (message) {
            addMessage(obj, {
                "message": message,
                "sender": obj.agent.name,
                "timestamp": new Date()
            }, true);
            //sendToWss();
            $(obj.input).val("");
            onTyping(obj);
            evaluateTimestamp(obj);
        }
    }

    /** Define components */
    function addChatWrapper(obj, descX, descY, x, y) {
        if (!obj.readOnly) {
            const div = `<div id="${obj.chatWindowId}" class="chat draggable" style="height: ${obj.height}px; width: ${obj.width}px; ${descX}: ${x}px; ${descY}: ${y}px"></div>`;
            $(obj.parent).append(div);
        }
        obj.chatWindowId = `#${obj.chatWindowId}`;
    }

    function addHeader(obj) {
        const _ticket = obj.ticket;
        const _contact = obj.contact;
        const div = 
        `<div class="header">
            <div class="control-bar">
                <a class="btn-minimize"><i class="fa fa-minus"></i></a>
                <a class="btn-close"><i class="fa fa-times"></i></a>
            </div>
            <div class="flex-h width-100">
                <div class="avatar align-cc">
                    <img
                        data-char-count="1"
                        data-name="${_contact.name}"
                        src="${_contact.profileUrl}"
                        onclick=""
                    />
                </div>
                <div class="flex-v" style="flex: 1; overflow: hidden;">
                    <div class="height-50 ellipsis align-vb" style="max-width: 50%;">
                        <span class="capital" title="${_contact.name}">${_contact.name}</span>
                    </div>
                    <div class="height-50 flex-h align-vt" style="margin-top: 4px">
                        <div class="flex-h button">
                            <button type="submit" onclick="closeTicketFromWidget('chat_id')"><i class="fa fa-check"></i></button>
                            <button type="submit" onclick="escalateTicketFromWidget('chat_id')"><i class="fa fa-share-square"></i></button>
                        </div>
                        <div class="flex-v width-100" style="text-align: right; padding-right:24px">
                            <span class="capital ellipsis" title="${_ticket.channel.name}">${_ticket.channel.name}</span>
                            <span class="capital ellipsis" title="${_ticket.number}" style="font-size: 10px;">${_ticket.number}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        
        $(obj.chatWindowId).append(div);
        $(obj.chatWindowId + " .btn-minimize").click(function(e){
            e.preventDefault();
            let minimized = $(obj.chatWindowId).hasClass("minimized");
            if (minimized) {
                onOpen(obj);
            } else {
                onMinimize(obj);
            }
        });
        $(obj.chatWindowId + " .btn-close").click(function(e){e.preventDefault();onClose(obj);});
        $(obj.chatWindowId).draggable({ handle: '.header', containment: obj.parent, scroll: false });
    }

    function addContent(obj) {
        const div = `<div class="content"><div class="messages-wrapper"></div></div>`
        $(obj.chatWindowId).append(div);
        obj.content = $(obj.chatWindowId + " .messages-wrapper");
    }

    function addFooter(obj) {
        const message_placeholder = "Type message or use '/' for canned message..."
        const div = 
            `<div class="footer">
                <div class="input">
                    <textarea data-emojiable="true" type="text" class="message-input" placeholder="${message_placeholder}"
                    autocomplete="off"></textarea>
                </div>
                <div class="flex-v">
                    <div class="button">
                        <button class="attachment" type="button">
                            <span class="fa fa-smile-o fa-lg" aria-hidden="true"></span>
                        </button>
                        <button class="attachment" type="button">
                            <span class="fa fa-paperclip fa-lg" aria-hidden="true"></span>
                        </button>
                        <button type="submit" class="message-submit">Send</button>
                    </div>
                    <span class="message-count-char"></span>
                </div>
                <ul class="dropdown-menu dropdown-menu-right" style="display: none;">
                    <li>
                        <label
                            for="fileuploadchat_id"
                            class="message-attachment-selection attachment-selection-file"><i class="fa fa-paperclip" aria-hidden="true"></i> Send
                            File
                        </label>
                    </li>
                    <li>
                        <label
                            class="message-attachment-selection attachment-selection-button"
                            onclick="onAddButton([{'name':'chatId', 'value':'chat_id'},{'name':'channelType', 'value':'webchat'}]);"><i class="fa fa-share-square-o" aria-hidden="true"></i> Send
                            Library
                        </label>
                    </li>
                    <li>
                        <label
                            class="message-attachment-selection attachment-selection-form"
                            onclick="onAddForm([{'name':'chatId', 'value':'chat_id'},{'name':'channelType', 'value':'webchat'}]);"><i class="fa fa-check-square-o" aria-hidden="true"></i> Send
                            Form
                        </label>
                    </li>
                    <li>
                        <label
                            class="message-attachment-selection attachment-selection-form"
                            onclick="onAttachChatHistory('chat_id');"><i class="fa fa-file" aria-hidden="true"></i>
                            Chat History
                        </label>
                    </li>
                    <li>
                        <label
                            class="message-attachment-selection attachment-selection-feedback"
                            onclick="onSendFAQ([{'name':'chatId', 'value':'chat_id'},{'name':'channelType', 'value':'webchat'}]);"><i class="fa fa-navicon" aria-hidden="true"></i>
                            Send FAQ
                        </label>
                    </li>
                </ul>
            </div>`;
        $(obj.chatWindowId).append(div);
        obj.input = obj.chatWindowId + " .footer .input textarea";
        $(obj.input).on('input', function() { onTyping(obj); });
        $(obj.chatWindowId + " .message-submit").on('click',  function() {
            const text = $(obj.input).val();
            onSendMessage(obj, text);
        });
    }

    function addMessage(obj, message, agent = true) {
        const _contact = obj.contact;

        let div;
        if (agent) {
            div = 
            `<div class="message agent delivered">
                <div class="flex-v bubble">
                    <div class="text">${nl2br(escapeHTML(message.message))}</div>
                    <div class="sender">${escapeHTML(message.sender)}</div>
                    <div class="timestamp" data-value="${message.timestamp}" title="${formatTimestamp(message.timestamp, true)}">${formatTimestamp(message.timestamp)}</div>
                </div>
            </div>`

        } else {
            div =
            `<div class="message customer">
                <figure class="avatar">
                    <img
                        data-char-count="1"
                        data-name="${_contact.name}"
                        src="${_contact.profileUrl}"
                        onclick=""/>
                </figure>
                <div class="flex-v bubble">
                    <div class="text">${nl2br(escapeHTML(message.message))}</div>
                    <div class="timestamp" data-value="${message.timestamp}" title="${formatTimestamp(message.timestamp, true)}">${formatTimestamp(message.timestamp)}</div>
                </div>
            </div>`
        }
        obj.messages.push(message);
        $(obj.content).append(div);
        scrollToBottom(obj);
    }

    class ChatWindow {
        constructor(manager, agent, ticket, config) {
            _mgr = manager;

            this.id = ticket.number || 'sample';
            this.width = config.width;
            this.height = config.height;
            this.readOnly = config.readOnly || false;
            this.parent = config.parent || 'body';
            this.agent = agent;
            this.ticket = ticket;
            this.contact = ticket.contact;
            this.chatWindowId = `chat-${ticket.number}`;
            this.content = null;
            this.input = null;
            this.messages = [];
        }
        
        create(position) {
            addChatWrapper(this, position.descX, position.descY, position.x, position.y);
            addHeader(this);
            addContent(this);
            addFooter(this);
            //addLoader(this);

            return this.chatWindowId;
        }

        show() {
        }

        addMessages(messages) {
            if (messages !== null) {
                messages.forEach(message => {
                    addMessage(this, message, message.agent);
                });
                //removeLoader();
            }
        }
    }

    return ChatWindow;
})();
