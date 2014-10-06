# (under construction)

# Apollo

IM, group chat, and video calls built on [Respoke](https://respoke.io).

## Requirements

* A [Respoke account](https://respoke.io), an app ID, an app secret, and a role ID.
* Node.js
* MongoDB

## Usage

1. Edit settings inside `./config.example.js` and rename it to `./config.js`.

2. Perform the following commands in a terminal:

    * `git clone https://github.com/respoke/apollo`
    * `cd apollo`
    * `npm install`
    * `npm start`

3. Apollo will be running at [http://localhost:3000/](http://localhost:3000/).

## Configuration

### Google Auth

You should be able to input your google auth credentials in `./config.js`, set `config.google.enable = true` and it will work.

This does require creating a google project in their developer console. [This blog post](http://scotch.io/tutorials/javascript/easy-node-authentication-google) gives an overview of basic concepts for google oauth 2.0.
