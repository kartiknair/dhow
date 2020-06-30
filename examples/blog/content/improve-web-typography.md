---
title: Improve your web typography with a few solid tips
date: 1590424023576
description: A few solid & easily implementable tips to step up your website's type game
---

I try and make my websites look nice. I think the visual aspect of a website is very important especially to an average visitor. A regular person doesn't care about what architecture you're using to build your website, they care if it looks good and loads fast. And since typography is very important to a website's looks, today we'll be discussing a few ways you can immediately improve your web typography.

Typography is the base of all web design. Text is in my opinion the majority of a website's content (couldn't find any studies about this but I'm pretty sure this is true). So how do you make text look nice? There are a few things to consider:

1. Size (& the scaling in between different levels)
2. Spacing
3. Font choice

### Size (& scaling)

The type scale is crucial so that a user knows what hierarchy you're trying to convey. You can find great ways to generate type scales online, I'm personally a fan of [https://type-scale.com/](https://type-scale.com/) which let's you visually calculate a type scale for your website. Here's an example of a type scale (this particular one is inspired from [tailwind](https://tailwindcss.com)) implemented in CSS:

```css
html,
body {
	font-size: 1rem;
}

h1 {
	font-size: 2.25rem;
}

h2 {
	font-size: 1.875rem;
}

h3 {
	font-size: 1.5rem;
}

h4 {
	font-size: 1.25rem;
}

h5 {
	font-size: 1.125rem;
}

h6 {
	font-size: 0.875rem;
}
```

This will immediately make a difference to your websites by clarifying how the hierarchy of content works. While this will look great on almost all devices we need to consider people on high resolution displays & small phones as well. For this I've started employing a few media queries to handle scaling all the type in my website responsively for them:

```css
/* ↓ This one is for smaller phones ↓ */
@media (max-width: 350px) {
	html {
		font-size: 0.9rem;
	}
}

/* ↓ These are for high-res displays ↓ */
@media (min-width: 1900px) {
	html {
		font-size: 1.5rem;
	}
}

@media (min-width: 2500px) {
	html {
		font-size: 2rem;
	}
}

@media (min-width: 3000px) {
	html {
		font-size: 2.5rem;
	}
}

@media (min-width: 3400px) {
	html {
		font-size: 3rem;
	}
}
```

As you can see we're changing the size on the `html` tag which will affect what a `rem` means for everything else on your website, a great way to easily & responsively scale everything.

### Spacing

Spacing is very very important, have a look at the 2 websites below, which one do you think is better designed?

![The first website](website-one_noxng5.png)

![The second website](website-two_jxvkuy.png)

Even though both of them use the same font and even the same type scale, the second one (in my opinion) objectively looks better. All it took was setting the correct `line-height` and making sure that the user doesn't have to track their eyes from one corner of the screen to the other. I usually accomplish this by wrapping all my text in a `<main>` tag and then size it accordingly:

```css
html,
body {
	line-height: 1.5; // <- this will depend on your font
}

main {
	width: 50%;
	margin: 6% 25%;
}

@media (max-width: 768px) {
	main {
		width: 80%;
		margin: 15% 10%;
	}
}

@media (max-width: 350px) {
	main {
		width: 90%;
		margin: 15% 5%;
	}
}
```

Pretty simple in terms of CSS but has a huge impact on readability and pleasantness to look at.

### Font choice

Choosing the right font for your website depends very heavily on the website and what it's purpose is. What matters most in font choice is that you make sure that it's legible. Since the purpose of text is to convey information (at least in the context of text heavy websites) using a font that isn't good at that wouldn't be very productive.

I leave it to you to make good choices in this area but if you're interested you can see some of my favourite open-source fonts below:

1. [Inter](https://fonts.google.com/specimen/Inter)
2. [Merriweather](https://fonts.google.com/specimen/Merriweather)
3. [Metropolis](https://github.com/chrismsimpson/Metropolis)
4. [EB Garamond](https://fonts.google.com/specimen/EB+Garamond)
5. [Jost\*](https://fonts.google.com/specimen/Jost)
6. [Libre Baskerville](https://fonts.google.com/specimen/Libre+Baskerville)

### Parting words

That's all for this short article, I just wanted to share some easily implementable styling tips for web typography. I've compiled all of my basic typography styling into a simple starter CSS file ([GitHub gist link](https://gist.github.com/kartiknair/00521222c6e2ae4b385d91c400debd30)) feel free to use it in any of your projects. Have a nice day & stay safe!
