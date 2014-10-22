# (under construction)

# Apollo

IM, group chat, and video calls built on [Respoke](https://respoke.io).

## Requirements

* A [Respoke account](https://respoke.io), an app ID, an app secret, and a role ID.
* Node.js
* MongoDB

## Usage

1. Perform the following commands in a terminal:
    ```bash
    git clone https://github.com/respoke/apollo
    cd apollo
    npm install
    ```

1. Edit settings in the **two config files**:
    - Server configuration: `./config.example.js` and copy to `./config.js`
    - Browser configuration: `./public/js/client-config.example.js` and copy to `./public/js/client-config.js`

1. Start the app via terminal:
    ```bash    
    npm start
    ```

1. Apollo will be running at [http://localhost:3000/](http://localhost:3000/).


### Google Auth

You should be able to input your google auth credentials in `./config.js`, set `config.google.enable = true` and it will work.

This does require creating a google project in their developer console. [This blog post](http://scotch.io/tutorials/javascript/easy-node-authentication-google) gives an overview of basic concepts for google oauth 2.0.

### Custom message parsing plugins

Apollo lets you add your own plugins to parse message contents. You might want to turn a certain string into a link, or fetch an image when a particular string is in a message, embed a video, etc.

Message parsing plugins are middleware and executed **asyncronously in series** according to the `clientConfig.messageRenderingMiddleware` array in your `./public/js/client-config.js` file.

Example middleware:

    function (messageInputText, next) {

        // replace all instances of "Billy" with "Cheeseface"
        var err = null;

        next(err, messageInputText.replace(/Billy/g, "Cheeseface"));

    }

### Desktop app

##### Requirements

* [Grunt](http://gruntjs.com)

If you would like to build the desktop app, proceed with the following steps.

1. Edit `./nodewebkit.json` and change thesettings to meet your needs.
1. Set the url to your deployed Apollo application in `./public/passthrough.example.html` under the `<meta http-equiv . . .>` tag. Save it as `./public/passthrough.html`.
1. From the Apollo directory, run `grunt release`.
1. The applications will be in the `./release/<app name>` folder.
