# Visualization of related subreddits & Wikipedia pages

* Builds an interactive graph of related subreddits and Wikipedia pages
* Ctrl click any node to dig deeper into it
* Forked from [Andrei Kashcha's project](https://github.com/anvaka/sayit)
* [Live demo](https://234test234.com/explorer/)
* Written in **Vue**

[![demo](https://i.imgur.com/xKlxRkf.gif)]

## The data

I used suggestions for auto-complete and related data to draw UI from live 'GET' API of subreddit and Wikipedia.

## Local Build Setup

```bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

'npm run build' will create a build (html, js & css code) in './dist' directory which can be usable directly as static web module.

Copy the contents of the `dist` directory to web root directory of your server. Your server must support PHP.