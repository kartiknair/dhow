---
title: Noize.ml
description: A web app that I built last summer. It helps people relax by letting them choose from a range of relaxing music/sounds and watch animated GIFs while listening. It’s open source and built with react.
date: 1589993500004
image: /images/noize.png
image_alt: Floating iPhone & iPad showing the Noize website on it's homepage
link: https://noize.ml
color: D4FC79
---

Noize.ml was a web app that I built last summer when I had a lot of free time. While working on something else I was looking for a website that has relaxing sounds and music to listen to and found a few but felt they were overkill and that their UI was distracting. So I decided to build something very simple and also added GIFs so people can experience full chill.

Noize was built using plain React, this was before I discovered Next or Gatsby so I didn't take advantage of the project being relatively easy to make static however it's still pretty fast so I'm not very upset.

This project mainly taught me about important web concepts relating to large files as all the audio files were 1 hour long and all the GIFs were massive. After a lot of research finding out about how large files should be handled I decided to use [backendless](https://backendless.com) (initially it was firebase but I ran into their limits very quickly). Now once the user goes to the page with the music player the ausio file is sourced dynamically from a backendless file database.

For the GIFs I decided to use videos instead as that's what many big companies like gyfcat and reddit use. However this led to a strange issue where on chrome on mobile the videos rendered as black boxes. After some research I found that this was a bug in chrome android and could be fixed by changing a few settings. Sadly that responsibility wold be on the user.

However this was a very fun project to build and surprisingly once I posted it to [ProductHunt](https://www.producthunt.com/posts/noize-ml) and found that people were genuinely interested and I still get a few visitors daily who spend hours on the website which makes me very happy. What else is the purpose of building stuff other than bringing joy and peace to other people.
