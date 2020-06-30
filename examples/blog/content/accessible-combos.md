---
title: Generating accessible color combinations for the web
date: 1589279182664
description: Creating a unique experience for every visitor with generative design
---

Hey everyone! This is gonna be a pretty short post but I wanted to show you how easy it is to have the color scheme for your website be generated randomly on the client-side. It's a pretty interesting experience for the user but I don't think it makes sense for most websites, as most businesses (& even individuals) would want to stick to a more standard color scheme so they can stay consistent to their brand identity. However, if you find something cool to do with these accessible combos do share it with me I would love to see!

Now let's get to the actual code. There are a few ways to do this, I recently found a tiny (less than 2kb) npm package called colors2k that offers this functionality but I also wanted to show you how it's possible to do this using only vanilla JS so let's start with the easy way first. For all these examples I'm using a regular HTML page being bundled using [parcel](https://parceljs.org/) and also pulling in a modified version of [grotesk](https://grotesk.now.sh) for basic styling.

### Setup

For those not familiar this is how you create a new parcel project for the rest who want to skip directly to the combo generation [click here](#generating-the-combos):

```bash
mkdir accessible-combos
cd accessible-combos
npm init -y
npm i -D parcel-bundler
```

Let's create a `src` directory and add our HTML & JavaScript file. I'm using just regular HTML boilerplate, you've probably seen this a million times:

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>Accessible Combos</title>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="author" content="Kartik Nair" />
		<meta
			name="description"
			content="Generating accessible color combinations for the web"
		/>
		<link href="./style.css" rel="stylesheet" />
	</head>
	<body>
		<main>
			<h1>Hello accessible combos</h1>
			<p>
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Debitis
				minus sequi nesciunt, sapiente dignissimos ut, est magni,
				facilis repellat corrupti adipisci dicta ullam. Corrupti
				voluptates assumenda reiciendis quod placeat maxime.
			</p>
		</main>
		<script src="./index.js"></script>
	</body>
</html>
```

And then to your `package.json` you would add the following scripts:

```json
"start": "parcel src/index.html",
"build": "parcel build src/index.html"
```

### Generating the combos

Great we're all set up now we can actually install the package I told you about:

```bash
npm i colors2k
```

Now let's import it in our JS file and use it's contrast function:

```javascript
import { getContrast } from "colors2k";

console.log(getContrast("#ffffff", "#000000");
```

As you can see that's pretty cool. But looping over the more than 16 million colors that hexadecimal provides would be pretty unnecessary and not that nice looking. Instead a better idea would be to find a list of colors that look nice and within that list find accessible combos. So that's what I did, and after a bit of searching I found two great options [cloudflare designs color pallette](https://cloudflare.design/colors) & the [best of from the color-names project](https://unpkg.com/color-name-list@5.23.0/dist/colornames.bestof.json) both are still very large lists but the cloudflare one is significantly smaller so I'm going to go with that one but as you can see there are more options out there.

I created a `colors.js` file and exported the colors json from there, so now in my index file I can loop through each of them to get a combo that works (by works I mean a combo that is accessible according to WCAG standards, so a contrast ratio greater than 7.1). Once I get a working combo I'm creating a style element using those colors and appending it to the head of the document:

```javascript
import { getContrast } from 'color2k'
import { cloudflareColors } from './colors'

let accessibleCombo = null

while (!accessibleCombo) {
	let randomPair = [
		cloudflareColors[Math.floor(Math.random() * cloudflareColors.length)]
			.hex,
		cloudflareColors[Math.floor(Math.random() * cloudflareColors.length)]
			.hex,
	]

	if (getContrast(randomPair[0], randomPair[1]) > 7.1)
		accessibleCombo = randomPair
}

const newStyle = document.createElement('style')
newStyle.innerHTML = `
main {
  background-color: ${accessibleCombo[0]};
  color: ${accessibleCombo[1]};
}`
document.head.appendChild(newStyle)
```

Pretty simple right? And the results are very pleasing to look at:

![A demo of the result](combos-demo_ntlpp0.gif)

### Learning how to do it ourselves

While using a library is awesome (especially a well made one) it's important that we understand how it works. So I decided that we could learn how to do this ourselves. The recommended method to get contrast ratio ([by the WCAG at least](https://www.w3.org/TR/WCAG20/#contrast-ratiodef)) is to divide the **relative luminance** of the lighter color by the relative luminance of the darker color. What's a relative luminance you ask? Well it's the relative brightness of a color, basically how close it would be to black if the image was black & white (between 0 as pure white, which is not close at all and 1 which would be pure black).

So how do we calculate it then, well thankfully the [WCAG has a guideline for that as well](https://www.w3.org/WAI/GL/wiki/Relative_luminance), the thing is to implement this formula you would have to have your color in RGB format so we need to implement a HEX → RGB conversion as well.

This is surprisingly easy to implement as all we need to do is split the string into groupings of 2s and then use the built in `parseInt` function to convert their radix:

```javascript
const hexToRgb = (hexString) => {
	if (hexString.startsWith('#')) hexString = hexString.substr(1)
	return [
		parseInt(hexString.substring(0, 2), 16),
		parseInt(hexString.substring(2, 4), 16),
		parseInt(hexString.substring(4, 6), 16),
	]
}

console.log(hexToRgb('#ffffff')) // [255, 255, 255]
```

Nice! That was pretty simple. Now let's implement the relative luminance formula using what WCAG gives us. This is the formula they have on their website:

![The formula on WCAG's website](wcag-formula_ny9qlg.png)

So mapping this out would be like this. Take each value from our RGB array and divide it by 255 and then based on its size perform one of the two formulas given. Once we have the 3 values for each channel we'll do the final formula given at the top to get our luminance. Sounds good? Let's code it:

```javascript
const relativeLuminance = (rgbArray) => {
	let [r, g, b] = rgbArray.map((channel) => {
		return channel / 255 <= 0.03928
			? channel / 255 / 12.92
			: ((channel / 255 + 0.055) / 1.055) ** 2.4
	})
	return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

console.log(relativeLuminance(hexToRgb('#ffffff'))) // 1
```

We're very close to the result now. All we have to do is implement the final formula where we compare the luminance of the two colors. To be specific we have to check which one is the lighter and that has to be L1 in this formula: `(L1 + 0.05) / (L2 + 0.05)`. Let's implement it:

```javascript
const getContrast = (color1, color2) => {
	const luminance1 = relativeLuminance(hexToRgb(color1)),
		luminance2 = relativeLuminance(hexToRgb(color2))

	return luminance1 > luminance2
		? (luminance1 + 0.05) / (luminance2 + 0.05)
		: (luminance2 + 0.05) / (luminance1 + 0.05)
}
```

And that's it we've done it! Here's the full code for our vanilla implementation that performs in the exact same way as using the `colors2k` library:

```javascript
import { cloudflareColors } from './colors'

const hexToRgb = (hexString) => {
	if (hexString.startsWith('#')) hexString = hexString.substr(1)
	return [
		parseInt(hexString.substring(0, 2), 16),
		parseInt(hexString.substring(2, 4), 16),
		parseInt(hexString.substring(4, 6), 16),
	]
}

const relativeLuminance = (rgbArray) => {
	let [r, g, b] = rgbArray.map((channel) => {
		return channel / 255 <= 0.03928
			? channel / 255 / 12.92
			: ((channel / 255 + 0.055) / 1.055) ** 2.4
	})
	return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const getContrast = (color1, color2) => {
	const luminance1 = relativeLuminance(hexToRgb(color1)),
		luminance2 = relativeLuminance(hexToRgb(color2))

	return luminance1 > luminance2
		? (luminance1 + 0.05) / (luminance2 + 0.05)
		: (luminance2 + 0.05) / (luminance1 + 0.05)
}

let accessibleCombo = null

while (!accessibleCombo) {
	let randomPair = [
		cloudflareColors[Math.floor(Math.random() * cloudflareColors.length)]
			.hex,
		cloudflareColors[Math.floor(Math.random() * cloudflareColors.length)]
			.hex,
	]

	if (getContrast(randomPair[0], randomPair[1]) > 7.1)
		accessibleCombo = randomPair
}

const newStyle = document.createElement('style')
newStyle.innerHTML = `
main {
  background-color: ${accessibleCombo[0]};
  color: ${accessibleCombo[1]};
}
  `
document.head.appendChild(newStyle)
```

Cool that was it for this post hope you find this little snippet useful & make something cool woth it. You can see it live at [https://accessible-combos.now.sh](https://accessible-combos.now.sh) or check out the code at [https://github.com/kartiknair/accessible-combos](https://github.com/kartiknair/accessible-combos). Thanks for reading, if you wanna say hello hit me up on twitter, I'm [@kartikajitnair](https://twitter.com/kartikajitnair/). Stay safe ✌.
