---
title: Grotesk.css
description: Grotesk is a CSS library and react component that aims to make web typography a bit more simple. It uses Scss and once minified comes in at a a tiny size of only 2kb.
date: 1589993500003
image: /images/grotesk.png
image_alt: iPhone with overflow like a scroll showing the Grotesk website (demoing the libraries usage)
link: https://grotesk.now.sh
color: E6DEE9
---

Grotesk is a project I mostly built for myself. I've noticed that almost every single website I start out building I'll always style the typography first, this meant especially for content-based sites I ended up repeating the same styles many many times. So I built Grotesk, it's a CSS library and react component that makes web typography simple and themeable.

The way it works for the CSS library is using Scss and their variables. The reason I chose Scss instead of CSS custom properties is so that those few people who would like to support legacy browsers like IE 11 can still use the library. The theming for Scss is very simple and since the library only deals with typography it comes out at only 2kb (once minified) which is pretty awesome.

When I first started out building websites I didn't care about performance or accessibility, my attitude was basically if it works on my system it's good enough. After a few months I realized how ignorant I really was, and now I feel like I've become the total opposite, I notice myself visiting [BundlePhobia](https://bundlephobia.com) and running lighthouse before every commit (yes I know there's a GitHub hook for it, I'm currently working on setting that up). This has maybe pushed my design to be more brutalist so that it runs quick however perhaps that's how the web was meant to be.
