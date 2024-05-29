function setIframe(prop, value) {
    $('#chat-iframe').css(prop, value);
  }
  function displayIcon() {
    setIframe("width", "64px");
    setIframe("height", "64px");
    setIframe("position", "absolute");
    setIframe("top", "50%");
    setIframe("right", "0");
  }
  function displayWindow() {
    setIframe("width", "448px");
    setIframe("height", "648px");
    setIframe("position", "absolute");
    setIframe("top", "unset");
    setIframe("bottom", "0");
  }
  
  function initChatIframe(iframe, email, password) {
    const div = `
    <div class="iframe-wrapper">
        <iframe id="chat-iframe" allowtransparency="true" src="${iframe}" frameborder="0"></iframe>
    </div>`;
    $("body").append(div);

    $('#chat-iframe').on('load', function() {
      var data = {
          event: 'connect',
          username: email,
          password: password
      };
      $("#chat-iframe")[0].contentWindow.postMessage(data, '*');
    });

    window.addEventListener('message', function(event) {
        var data = event.data;
        if (typeof data.from !== 'undefined' && data.from == 'chat-window' && typeof data.type != 'undefined') {
          if (data.type == 'displayIcon') {
            displayIcon();
          } else if (data.type == 'displayWindow') {
            displayWindow();
        }
        }
    });
    
  }