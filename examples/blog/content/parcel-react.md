---
title: My new react workflow with parcel
date: 1585920436498
description: Moving away from create-react-app & learning to bundle my own assets
---

Hello everybody 👋, I hope you’re staying safe out there in these trying times. I haven’t written anything in a while due to this situation but I thought why not share my new react workflow since some people might find it interesting, so here we go.

I’ve almost always used create-react-app as my react starter, sometimes Gatsby or Next.js for Static Sites & Server Side Rendering respectively, but mostly create-react-app for all my Single Page Apps. However as some of you might know the internals of create-react-app are abstracted away using the react-scripts package. This helps beginners like me get easily started without having to worry about webpack. But I was curious on how it actually worked and decided to make a react application from scratch.

While learning about bundlers I discovered [parcel](https://parceljs.org/) a bundler that requires zero configuration and works right out of the box. This got me really excited and after a few steps I got parcel working with react as well, here’s how I set it up. Also make sure to stick around till the end to see a super easy way to get started using a tiny package I made.

### Step 0

If you don't have node & npm installed already then go ahead and download both of their latest versions for your system from the previous links.

### Step 1

Create a directory for your project, on Windows I used the following commands I'm sure you can translate them over to your OS.

```bash
mkdir react-with-parcel
cd react-with-parcel
```

### Step 2

Initialize an npm project and download your dependencies with the following commands:

```bash
npm init -y
npm i -D parcel-bundler @babel/core @babel/preset-env @babel/preset-reactnpm i react react-dom
```

As you can see we initialize an npm project using `npm init` the `-y` flag is just there so it doesn't ask you the default questions. Then we install parcel-bundler and a few babel packages as dev dependencies (that's why the `-D` flag is used) and also `react` & `react-dom` as regular dependencies. I'm currently still using parcel v1 (i.e the parcel-bundler npm package not parcel) that's because parcel v2 is still in alpha and not yet stable. However once it is stable it promises some amazing features like out of the box support for jsx so we wouldn't even have to configure babel.

### Step 3

Now that we have all our dependencies installed we can actually create our application. Parcel works on the principal of having one html file as it's entry point (you can have multiple as well) and then uses that to bundle all the assets. So let's create an `index.html` file. Personally I put this file in a `src` directory but if you want you can directly put it in the root directory of your project. However make sure to change the path in the following steps.

```html
<!--The src/index.html file-->

<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Parcel & React</title>
	</head>
	<body>
		<div id="root"></div>
		<script src="./index.js"></script>
	</body>
</html>
```

As you can see we create a `div` with the id of "root" and then use a script tag to link to our JavaScript file. So let's create that JavaScript file.

```javascript
// The src/index.js file

import React from 'react'
import ReactDom from 'react-dom'
import './index.css'

const App = () => <h1>Hello World</h1>

ReactDom.render(<App />, document.getElementById('root'))
```

We've kept the file very simple but you can very easily import other components & css files either from your files or from npm packages. SInce I've imported "./index.css" let's go ahead & make that file:

```css
/* The src/index.css file */

* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

html {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
		Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

code {
	font-family: 'Courier New', Courier, monospace;
}
```

We've kept it very basic just some small resets and system fonts.

### Step 4

We're almost done! Now go to your `package.json` and add the `start` & the `build` scripts. This is an example of how your `package.json` will look now:

```json
{
	"name": "react-with-parcel",
	"version": "1.0.0",
	"description": "",
	"main": "index.js",
	"scripts": {
		"start": "parcel src/index.html",
		"build": "parcel build src/index.html"
	},
	"keywords": [],
	"author": "",
	"license": "ISC",
	"dependencies": {
		"react": "^16.13.1",
		"react-dom": "^16.13.1"
	},
	"devDependencies": {
		"@babel/core": "^7.9.0",
		"@babel/preset-env": "^7.9.0",
		"@babel/preset-react": "^7.9.4",
		"parcel-bundler": "^1.12.4"
	}
}
```

All we're doing is calling parcel & giving it the html file we want to use & for building a production build we call parcel build & again give it the html file. Parcel build will output to the dist directory in your project.

### And you're done

That's it just open up a terminal & run `npm start` and a development server should start up on [https://localhost:1234](https://localhost:1234). Amazing right!

### Making this even easier

Since I expect to be doing this many more times I decided to make a tiny npm package to bootstrap the project for me. So that it would be just as easy as create-react-app. And I'm finally done with the package I called it `parcreate` and you can run it in your terminals now.

```bash
# The recommended way: (so that you have the latest version)
npx parcreate my-apps-name

# The old fashioned way:
npm i -g parcreate
parcreate my-apps-name
```

Creating `parcreate` was a lot of fun and I will be adding more templates with additional features like `scss` very soon so keep a lookout.

You can find the github repo for parcreate [here](https://github.com/kartiknair/parcreate) and please let me know if you face any issues running it as I've only tested it on windows yet. Thank you all for reading about my findings & be sure to stay safe. Bye!

P.S. I’m trying to be more active on social media & meet more people so drop me a message on my twitter (@nairkartik\_).
