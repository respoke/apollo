# (under construction)

# Apollo

IM, group chat, and video calls built on [Respoke](https://respoke.io).

## Requirements

* Node.js
* MongoDB
* A [Respoke account](https://respoke.io), an app ID, an app secret, and a role ID.
* Make sure you create a Role in the Respoke developer console! *[More about Respoke permissions and roles](https://docs.respoke.io/tutorials/roles-and-permissions.html)*

## Setup

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


### Using Google OAuth 2.0 authentication

You should be able to input your google auth credentials in `./config.js`, set `config.google.enable = true` and it will work.

Google auth requires that you create a Google developer project in their [developer console](https://console.developers.google.com).
1. Click *Create Project* and select that project
1. Go to *APIs and Auth* > *Credentials* and click on "Create New Client ID" under Oauth
1. Choose "Web Application".
1. Add your site's base URL including http:// or https:// under "AUTHORIZED JAVASCRIPT ORIGINS". (e.g. https://localhost:8080)
1. Add <base URL>/auth/google/callback under "AUTHORIZED REDIRECT URI". (e.g. https://localhost:8080/auth/google/callback)
1. Obtain the Client ID and Client Secret for Apollo (the `google` section of `./config.js`)
1. Go to *APIs and Auth* > *Consent Screen* and add your information including a product name

[This blog post](http://scotch.io/tutorials/javascript/easy-node-authentication-google) gives an
overview of basic concepts for Google OAuth 2.0.

### Extending Apollo

##### Custom message parsing plugins

Apollo lets you add your own plugins to parse message contents. You might want to turn a certain
string into a link, or fetch an image when a particular string is in a message, embed a video, etc.

Message parsing plugins are middleware - **executed asynchronously, in series** according to the `clientConfig.messageRenderingMiddleware` array in your `./public/js/client-config.js` file.

Example middleware:

```javascript
function (messageInputText, next) {

    // replace all instances of "Billy" with "Cheeseface"
    var err = null;

    next(err, messageInputText.replace(/Billy/g, "Cheeseface"));

}
```

##### Custom server plugins

You can extend the base Apollo application.

An example plugin can be seen at `./example-plugin.js`.

Apollo automatically loads (via `require`) all plugins that are placed in the `./plugins/` folder.

### Desktop app

Apollo has a companion desktop application which uses node-webkit.

You must configure to point to your Apollo server, then build it. Thus, it will not work without
first setting up an Apollo server.

##### Requirements

* [Grunt](http://gruntjs.com)

If you would like to build the desktop app, proceed with the following steps.

1. Edit the following example config files and rename them:
    * `./nodewebkit.example.json` to `./nodewebkit.json`
    * `./public/passthrough.example.html` to `./public/passthrough.html`
1. From the Apollo directory, run `grunt release`.
1. The applications will be in the `./public/release/<your app name>` folder.
1. It is recommended to compress them by running `grunt pack`.

---

## License

GPL v2

See the LICENSE file for text.

###### Apollo - Copyright (c) 2014, Digium. All Rights Reserved. Licensed Software.
