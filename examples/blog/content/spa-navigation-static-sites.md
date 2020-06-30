---
title: SPA-like instant navigation in static sites
date: 1592718873315
description: Improve the user experience on your static sites with a tiny bit of JavaScript.
---

Single page applications have instant navigation. You click on a link and it changes views instantly. There might not be data & you might be shown a loading screen but still the navigation itself is instant and I've always missed this in pure static websites so, I thought I would try & implement something really simple to accomplish this nice boost in user experience.

The idea for the code is pretty simple. We need to get all the links on the page, check if they are internal, if they are we need to add a click event handler on them. This click handler will prevent the default action from happening & instead use the Browser History API to push a new entry in while also updating the DOM with the fresh content. It's only that last part which is a bit complex. So let's take a look at the Browser History API first.

It gives us a few functions that we can use to manipulate the browser history. They are:

1. `back()`
2. `forward()`
3. `go()`
4. `pushState()`
5. `replaceState()`

`back()` and `forward()` are pretty self-explanatory, they basically mimic the back and forward buttons in your browser. `go()` is the same except instead of back and forward you can specify exactly how far you want to travel from the current location (negative number for back, positive for forward; imagine a number line where 0 is the current location). `pushState()` let's us create a new entry in the history. This is what we're gonna use for our links as well, the reason we won't use `replaceState()` is because it won't create a new entry, all it will do is update the current entry. This would mean the back and forward buttons won't work as expected.

Alright so let's start implementing this in code. First we're gonna listen for the page load and then loop through all our links.

```javascript
window.onload = function () {
	document.querySelectorAll('a').forEach((link) => {
		// do something with link
	})
}
```

Now with each link we have to check if they are internal or not. For this we can use the `host` attribute that every `a` tag has & compare it to the `window.location.host`, if they are the same the link is internal. We're also gonna add a `data-internal` or `data-external` attribute to the link as a way to separately style them later:

```javascript
window.onload = function () {
	document.querySelectorAll('a').forEach((link) => {
		if (link.host === window.location.host) {
			link.setAttribute('data-internal', true)
		} else {
			link.setAttribute('data-external', true)
		}
	})
}
```

Now that we have this basic setup we need to actually intercept when an internal link is clicked and then use `history.pushState()` to add an entry to the browser history. But `pushState()` takes three arguments: state, title, & URL. In our case we'll just use our link's `href` as the `route` in our state object and also pass it as the title & URL. Here's how that looks:

```javascript
window.onload = function () {
	document.querySelectorAll('a').forEach((link) => {
		if (link.host === window.location.host) {
			link.setAttribute('data-internal', true)

			link.addEventListener('click', (e) => {
				e.preventDefault()
				const destination = link.getAttribute('href')
				history.pushState(
					{ route: destination },
					destination,
					destination
				)
			})
		} else {
			link.setAttribute('data-external', true)
		}
	})
}
```

**Quick note:** Use `link.getAttribute("href")` instead of `link.href` to get the actual href provided to the DOM. For example an a tag like this: `<a href="/foo">To foo</a>` when asked directly for href would give `http://localhost:5500/foo` (or whatever domain it's currently hosted on) but `getAttribute("href")` would return "/foo".

Great now our links change the URL without a page refresh but our DOM isn't updating, the webpage looks exactly the same. So let's deal with that.

### Updating the DOM

To update the DOM we actually need to get the new DOM. Since the page to which the link is pointing actually does exist, what we can do is use `fetch()` to get it's HTML content & then replace our current HTML with that. So let's make an async function called `updateDOM` to do this:

```javascript
async function updateDom(path) {
	const res = await fetch(path)
	const data = await res.text()
	document.querySelector('html').innerHTML = data
}
```

Pretty simple as you can see, when provided with a path like `/about` or `/blog/awesome-post.html` we'll use fetch to get a response & then use the `.text()` function to get it's plain text. Once we have that we just set our `html` elements innerHTML to be this text.

Now we need to call this function when our link is clicked:

```javascript
window.onload = function () {
  document.querySelectorAll("a").forEach(link => {
    if (link.host === window.location.host) {
        link.setAttribute("data-internal", true);

        link.addEventListener("click", (e) => {
          e.preventDefault();
          const destination = link.getAttribute("href");
          history.pushState({ route: destination }, destination, destination);
          await updateDom(destination);
        });
      } else {
        link.setAttribute("data-external", true);
      }
  })
}
```

Great! Now you should've seen your link working. But this has a few issues. It'll only work on the first page. To fix this you need to import your script in all your html files & also we're gonna call `updateLinks()` as soon as we update the DOM. We also have to make sure that we scroll back to the top like a regular link otherwise we might confuse the user. So now our `updateDom` function is looking like this:

```javascript
async function updateDom(path) {
	const res = await fetch(path)
	const data = await res.text()
	document.querySelector('html').innerHTML = data

	updateLinks()
	window.scrollTo(0, 0)
}
```

Now all we're missing is the back and forward buttons. To deal with this we need to actually listen for a window event called `onpopstate`, this event is fired when the back or forward button is clicked & the important thing to note is that it's fired after the location is updated. Which means we can just update our DOM using `window.location.pathname` as our new path. So let's add that to our code:

```javascript
window.onload = function () {
  {...}

  window.onpopstate = function () {
    updateDom(window.location.pathname);
  };
}
```

Great now everything works as expected. We've come a long way. But... we can still do some optimization. Now we're just updating the entire html even if a lot of it is the exact same. And while it won't have much difference for smaller websites, on a larger website this would be pretty jarring. Which is why we're gonna use a tiny (550byted minzipped) library called [*µ*domdiff](https://github.com/WebReflection/udomdiff) for this.

*µ*domdiff is just a single function and it takes 4 parameters (& a 5th optional one). Here's what it needs:

```javascript
futureNodes = udomdiff(
	parent, // where changes happen
	[...currentNodes], // Array of current items/nodes
	[...futureNodes], // Array of future items/nodes (returned)
	get, // a callback to retrieve the node
	before // the (optional) anchored node to insertBefore
)

console.log('The new DOM is now:', futureNodes)
```

In our case the parent will be the `<html>` element, the `currentNodes` will be the html elements child nodes, the `futureNodes` will be our html which we received from fetching, & our callback can just be a simple return parameter function.

The only problem is that our fetched html is text & `udomdiff` expects it to be an array of nodes. So we're gonna use `DOMParser` and it's `parseFromText()` function to convert our text into DOM nodes. Then we're gonna use `querySelector` to get it's html element's child nodes. So let's start with that:

```javascript
async function updateDom(path) {
  {...}

  const dataNodes = new DOMParser()
    .parseFromString(data, "text/html")
    .querySelector("html").childNodes;

  {...}
}
```

Now that we have that let's use `udomdiff`:

```javascript
async function updateDom(path) {
  {...}

  const get = (o) => o; // Just returning the provided node back

  const parent = document.querySelector("html");
  const currentNodes = document.querySelector("html").childNodes;
  const dataNodes = new DOMParser()
    .parseFromString(data, "text/html")
    .querySelector("html").childNodes;

  udomdiff(
    parent, // where changes happen
    [...currentNodes], // Array of current items/nodes
    [...dataNodes], // Array of future items/nodes (returned)
    get // a callback to retrieve the node
  );

  {...}
}
```

And we're finally done! Smooth & instant navigation between your static pages with a tiny amount of JavaScript. If you're doing this a lot perhaps you should look into established libraries like TurboLinks but for simpler websites I haven't encountered any edge cases using this.

That's it for this post, hope you found it helpful. You can find the full source code in this [GitHub Gist](https://gist.github.com/kartiknair/bd26bbc751332f64ba85095230c29314). Wanna say hi? I'm [@kartikajitnair](https://twitter.com/kartikajitnair) on twitter feel free to DM. That's all I have for now, stay safe!
