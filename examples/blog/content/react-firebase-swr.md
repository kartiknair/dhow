---
title: Learn how to build a fast & responsive markdown editor with React, Firebase, & SWR
date: 1589126909050
description: Building a sleek and user-friendly markdown editor.
---

I've recently embarked on quite the arduous journey of building my own CMS from scratch. Why you ask? That's for a different post 😊. However while working on this project I discovered an amazing data fetching hook called [useSWR](https://swr.now.sh) created by the amazing people at [Vercel](https://vercel.com), so I wanted to show you guys how SWR makes it so much easier to make fast and User-Friendly applications. It's surprisingly easy so let's get right into it. Since showing it to you with no context wouldn't be very interesting we're gonna build a markdown editor that uses [Firebase](https://firebase.google.com) for authentication and storing our data. So here we go...

### What is SWR

SWR is a data fetching strategy standing for Stale While Revalidate. This is a pretty popular data fetching strategy but Vercel published an npm package with React hooks that make it easy to use this strategy in web applications. The basic idea of the `useSWR` hook can be explained by looking at an example:

```javascript
import useSWR from 'swr'

const App = () => {
	const { data, error } = useSWR('STRING_KEY', doSomethingWithKey)

	if (error) return <div>Error while loading data!</div>
	if (!data) return <div>Loading...</div>
	return <div>We have {data}!</div>
}
```

As you can see the hook takes 2 arguments the first one is a string key that's supposed to be a unique identifier for the data usually this will be the URL of your API. And the the second argument is a function that returns data based on this key (usually some sort of fetcher function).

So now that we know the basics of SWR let's build an application with it. If you wanna skip ahead to a specific part check the Table of Contents below or if you wanna see the finished project then you can check it out live at [https://typemd.now.sh](https://typemd.now.sh 'https://typemd.now.sh') or see the source code at [https://github.com/kartiknair/typemd](https://github.com/kartiknair/typemd 'https://github.com/kartiknair/typemd').

![Preview of end result](typemd-result_ghunpe.png)

1.  [Prerequisites](#prerequisites)
2.  [Setup](#setup)
3.  [Creating a Firebase App](#creating-a-firebase-app)
4.  [The model](#the-model)
5.  [Configure Firebase in your code](#configure-firebase-in-your-code)
6.  [Basic navigation](#basic-navigation)
7.  [Setting up a Firestore database](#setting-up-a-firestore-database)
8.  [Getting files from the database](#getting-files-from-the-database)
9.  [Basic dashboard UI](#basic-dashboard-ui)
10. [The editor](#the-editor)
11. [Deleting files](#deleting-files)
12. [Image uploads](#image-uploads)
13. [General improvements](#general-improvements)
14. [Conclusion](#conclusion)

### Prerequisites

Make sure you have the latest (or somewhat recent) versions of [Node](https://nodejs.org) and [NPM](https://npmjs.org) installed, also have your favourite code editor on the ready we're gonna put it to lots of use today.

### Setup

For our first step we're gonna use create-react-app to bootstrap a React project and also install a few dependencies:

1. `firebase` our "backend"
2. `react-with-firebase-auth` a HOC that makes authentication with firebase very easy
3. `rich-markdown-editor` is the markdown editor we'll use for this app. I chose this one specifically because it has a very friendly API to work and also has a very user-friendly design.
4. `@reach/router` as our client-side routing algorithm, you'll see why we'll need this very soon.

Run these commands to create the app and install said dependencies:

```shell
npx create-react-app markdown-editor

# Or on older versions of npm:
npm i -g create-react-app
create-react-app markdown-editor

cd markdown-editor
npm i firebase react-with-firebase-auth rich-markdown-editor @reach/router
```

I also uninstalled the testing libraries and testing specific code as those are beyond the scope of this post but you can keep them and use them as you like.

### Creating a Firebase App

To be able to use Firebase in our web app we actually need to set up a Firebase project so let's do that. Head over to [https://firebase.google.com](https://firebase.google.com 'https://firebase.google.com') and log in to your Google account. Then in the console create a new project:

![Step 1 of configuring firebase](firebase-1_kcp95k.png)

I'm going to choose not to have analytics on but you can do so if you wish.

![Step 2 of configuring firebase](firebase-2_txfjmh.png)

Now that we have our project created in the project click the little web icon:

![Step 3 of configuring firebase](firebase-3_or6ek7.png)

And copy this configuration object it gives you and keep it wherever you like (don't worry too much about it you can come back and view it later in the dashboard):

![Step 4 of configuring firebase](firebase-4_jbbrid.png)

We're also going to set up our authentication so head to the authentication section and choose whichever providers you would like to support and follow their instructions on how to set it up. The 'Google' provider works with 0 config so if you just want a quick start that's what I would recommend. I also followed the docs and enabled the 'GitHub' provider but that's up to you.

![Step 5 of configuring firebase](firebase-5_eodv8k.png)

### The model

Before we jump into the code let's structure the application in our head. We need mainly three different views: the 'Log In' view which the user will see if they are not logged in, the 'Dashboard' which will show a logged in user all their files, and finally the 'Editor' view which will be the view that the user will see when they are editing a file. Great now that we have that planned out in our head let's make it.

I personally don't like the way create-react-app so I'm gonna restructure the code a bit, but this is how **_I_** like to do it and you don't have to do it this way. It's well known in the React community that you can basically do whatever you want as long as you're comfortable with it, so do as you like but make sure to translate the paths that I'm using.

![File structure changes](file-structure_ss6urc.png)

### Configure Firebase in your code

Great now that we've done all our prep we can finally start working on the code. First let's set up firebase in our project, so you remember that configuration object now make a file in your project which exports that object out:

```javascript
/* src/lib/firebaseConfig.js */

export default {
	apiKey: 'YOUR_API_KEY',
	authDomain: 'YOUR_AUTH_DOMAIN',
	databaseURL: 'YOUR_DATABASE_URL',
	projectId: 'YOUR_PROJECT_ID',
	storageBucket: 'YOUR_STORAGE_BUCKET',
	messagingSenderId: 'YOUR_SENDER_ID',
	appId: 'YOUR_APP_ID',
}
```

You might be worried about having this hard coded in your code, but it isn't that much of an issue if somebody gets their hands on your configuration because we're gonna set up authentication rules on your database. If you're still worried you can add all these values to a '.env' file and import it in that way.

Now that we have this configuration we're gonna make another file where we initialize our firebase app using this config and then we'll export it out so we can reuse it in our code:

```javascript
import * as firebase from 'firebase/app'
import 'firebase/auth'

import firebaseConfig from 'lib/firebaseConfig'

// Check if we have already initialized an app
const firebaseApp = !firebase.apps.length
	? firebase.initializeApp(firebaseConfig)
	: firebase.app()

export const firebaseAppAuth = firebaseApp.auth()

export const providers = {
	googleProvider: new firebase.auth.GoogleAuthProvider(),
	githubProvider: new firebase.auth.GithubAuthProvider(), // <- This one is optional
}
```

Great! Now that our firebase app is set up let's go back to the mental image we created of our app, you remember that?

### Basic navigation

Well we're gonna implement that using reach-router and our firebase authentication HOC:

```javascript
/* src/components/App/App.js */

import React from 'react'
import { Router, navigate } from '@reach/router'

import withFirebaseAuth from 'react-with-firebase-auth'
import { firebaseAppAuth, providers } from 'lib/firebase'

import { Dashboard, Editor, SignIn } from 'components'
import './App.css'

const createComponentWithAuth = withFirebaseAuth({
	providers,
	firebaseAppAuth,
})

const App = ({ signInWithGoogle, signInWithGithub, signOut, user }) => {
	console.log(user)
	return (
		<>
			<header>
				<h2>TypeMD</h2>
				{user && (
					<div>
						<a
							href="#log-out"
							onClick={() => {
								signOut()
								navigate('/')
							}}
						>
							Log Out
						</a>
						<img alt="Profile" src={user.photoURL} />
					</div>
				)}
			</header>
			<Router>
				<SignIn
					path="/"
					user={user}
					signIns={{ signInWithGithub, signInWithGoogle }}
				/>
				<Dashboard path="user/:userId" />
				<Editor path="user/:userId/editor/:fileId" />
			</Router>
		</>
	)
}

export default createComponentWithAuth(App)
```

Yep I know it's a lot of code, but bear with me. So the basic idea is that we have a constant Header component and then below that we have our different routes. Since we wrap our App component with the firebase authentication HOC we get access to a few props like the sign in, sign out methods and also the currently logged in user (if there is one). We pass the sign in methods to our SignIn component and then we pass the sign out method to our header where we have our logout button. So as you can see the code is pretty intuitive in its qualities.

Now let's see how we handle the user logging in on our Sign In page:

```javascript
/* src/components/SignIn/SignIn.js */

import React from 'react'
import { navigate } from '@reach/router'

const SignIn = ({ user, signIns: { signInWithGoogle, signInWithGithub } }) => {
	if (user) {
		navigate(`/user/${user.uid}`)
		return null
	} else {
		return (
			<div className="sign-in-page">
				<h3>
					Welcome to TypeMD a simple &amp; beautiful online markdown
					editor
				</h3>
				<p>
					Sign in with your social accounts to have files that are
					synced accross devices
				</p>
				<div className="sign-in-buttons">
					<button onClick={signInWithGoogle}>
						Sign in with Google
					</button>
					<button onClick={signInWithGithub}>
						Sign in with GitHub
					</button>
				</div>
			</div>
		)
	}
}

export default SignIn
```

As you can see those methods we passed down to it are being used when the buttons are clicked and then we check if there is a logged in user we redirect them to the dashboard using the `navigate` method that reach-router provides.

### Setting up a Firestore database

Now that we have authentication set up we need to set up our database, so let's head to our firebase console again and let's make a firestore database. In your console click on database in the sidebar and choose 'Cloud Firestore' if it's not already selected. Then click start collection:

![Step 1 of creating a firestore database](firestore-1_gzucku.png)

I'm going to name the collection 'users' because that's how we're going to manage our data:

![Step 2 of creating a firestore database](firestore-2_vveszt.png)

For the first document I'm going to just add a test one because we're going to delete this right after:

![Step 3 of creating a firestore database](firestore-3_potmle.png)

Now let's delete the test document:

![Step 4 of creating a firestore database](firestore-4_ofdgyw.png)

If you remember I told you before that it doesn't matter if your configuration object gets leaked that's because we're going to head to the 'rules' section and set up a rule so that an authenticated user can only access their file. The language is pretty self explanatory so here's the rule:

```javascript
rules_version = '2';
service cloud.firestore {
    match /databases/{database}/documents {
        // Allow only authenticated content owners access
        match /some_collection/{userId}/{documents=**} {
            allow read, write: if request.auth.uid == userId
        }
    }
}
```

This rule works because of the way we're going to structure our data. The way we do it is once the user logs in we check if they're id is in the database, if it is we get that users `files` subcollection and return that, if they're not in the database then we'll create an empty entry for them which they can add files to later. The authentication rule just makes sure that an authenticated user can only access _their_ files and nobody else's.

Now if you remember our `firebase.js` file where we exported our firebase app and authentication providers, well in the same file add these two lines to make our database accessible by other files:

```javascript
import 'firebase/firestore'
export const db = firebaseApp.firestore()
```

### Getting files from the database

Now we can import that in our dashboard and create a function wherein we'll check if a user of the given id exists in the database, if so we return their data, and if not we create it let's call it `getUserData`:

```javascript
import { db } from 'lib/firebase'

const getUserFiles = async (userId) => {
	const doc = await db.collection('users').doc(userId).get()

	if (doc.exists) {
		console.log('User found in database')
		const snapshot = await db
			.collection('users')
			.doc(doc.id)
			.collection('files')
			.get()

		let userFiles = []
		snapshot.forEach((file) => {
			let { name, content } = file.data()
			userFiles.push({ id: file.id, name: name, content: content })
		})
		return userFiles
	} else {
		console.log('User not found in database, creating new entry...')
		db.collection('users').doc(userId).set({})
		return []
	}
}
```

As you can see from the above code firebase has done an amazing job at having readable queries which I appreciate a lot especially when debugging.

This is pretty great but we don't really have any files to look at. So let's also make a method to create a file based on a user ID and file name:

```javascript
const createFile = async (userId, fileName) => {
	let res = await db.collection('users').doc(userId).collection('files').add({
		name: fileName,
		content: '',
	})
	return res
}
```

Pretty simple right? In this function we're finding our user in the users collection and the in that user's files sub-collection we're adding a new file. Now we're using the `add` function instead of `set` as we were using before so that firebase can randomly generate the ID for our file. This allows users to have multiple files of the same name with no issues.

### Basic Dahsboard UI

Now we can start with the UI for our Dashboard so let's just make a simple list where each element will be using reach-router's Link to navigate the user to the editor page:

```javascript
/* src/components/Dashboard/Dashboard.js */

const Dashboard = ({ userId }) => {
	const [nameValue, setNameValue] = useState('')
	const { data, error } = useSWR(userId, getUserFiles)

	if (error) return <p>Error loading data!</p>
	else if (!data) return <p>Loading...</p>
	else {
		return (
			<div>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						if (nameValue) {
							setNameValue('')
							createFile(userId, nameValue)
							mutate(userId)
						}
					}}
					className="new-file-form"
				>
					<input
						type="text"
						placeholder="Your new files name..."
						value={nameValue}
						onChange={(e) => setNameValue(e.target.value)}
					/>
					<button type="submit" className="add-button">
						Create
					</button>
				</form>
				<ul className="files-list">
					{data.map((file) => {
						return (
							<li key={file.id} className="file">
								<Link
									to={`/user/${userId}/editor/${file.id}`}
									className="link"
								>
									{file.name}
								</Link>
							</li>
						)
					})}
				</ul>
			</div>
		)
	}
}
```

Again we have a lot of code but that's mostly just the UI. However this is the first time we're using the `useSWR` hook and we're passing it the user ID as a key and then for it's data fetching function we pass it the `getUserData` method we created before. Then we use the same pattern that I showed you in the first example to check for errors and loading and finally if we have the data we loop through and show it in a list. We're also using hooks to keep track of the create file input form but I'm hoping you're already familiar with how to use them.

This is great but right now our Links going to the editor are pretty useless because we don't have an Editor component yet so how bout we do that now.

### The editor

As I mentioned earlier we're using an amazing open-source editor called `rich-markdown-editor` so we're going to import it and then use it's `defaultValue` prop to show us our saved content:

```javascript
/* src/components/Editor/Editor.js */

import React, { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { db } from 'lib/firebase'
import { Link, navigate } from '@reach/router'
import MarkdownEditor from 'rich-markdown-editor'

const getFile = async (userId, fileId) => {
	const doc = await db
		.collection('users')
		.doc(userId)
		.collection('files')
		.doc(fileId)
		.get()

	return doc.data()
}

const Editor = ({ userId, fileId }) => {
	const { data: file, error } = useSWR([userId, fileId], getFile)
	const [value, setValue] = useState(null)

	useEffect(() => {
		if (file !== undefined && value === null) {
			console.log('Set initial content')
			setValue(file.content)
		}
	}, [file, value])

	const saveChanges = () => {
		db.collection('users')
			.doc(userId)
			.collection('files')
			.doc(fileId)
			.update({
				content: value,
			})
		mutate([userId, fileId])
	}

	if (error) return <p>We had an issue while getting the data</p>
	else if (!file) return <p>Loading...</p>
	else {
		return (
			<div>
				<header className="editor-header">
					<Link className="back-button" to={`/user/${userId}`}>
						&lt;
					</Link>
					<h3>{file.name}</h3>
					<button
						disabled={file.content === value}
						onClick={saveChanges}
						className="save-button"
					>
						Save Changes
					</button>
				</header>
				<div className="editor">
					<MarkdownEditor
						defaultValue={file.content}
						onChange={(getValue) => {
							setValue(getValue())
						}}
					/>
				</div>
			</div>
		)
	}
}

export default Editor
```

Just like before we're using the same pattern where we have a method that gets the data and then we have useSWR with our key. In this case we're using an array of keys so that we can pass down both the user ID and file's ID to the fetcher function (which is `getFile()` here). We're also using the `useState()` hooks to keep track of the editors state, usually we would update the value of the editor with our stateful value but we don't have to do that here. Once our data is available we just pass it as the defaultValue to our editor and then track changes using it's provided onChange method.

You may have noticed the `useEffect()` at the top of the function. We're using that to actually set the initial value of our stateful value variable this helps us keep track of whether the user has unsaved changes or not.

---

Look at us now! We have a basic but working editor, now where do we go from here? Well there's a lot (& I mean a lot) of stuff to add to this & I'll cover a few of those in the improvements section. But for now we have two more crucial features that we could add and one of them is a lot more difficult to implement than the other. So let's start with the easy one:

### Deleting Files

A pretty small but important thing to add to our Dashboard component. For this we're going to use the `ref.delete` method that firebase provides, here's our `deleteFile` function:

```javascript
const deleteFile = async (userId, fileId) => {
	let res = await db
		.collection('users')
		.doc(userId)
		.collection('files')
		.doc(fileId)
		.delete()
	return res
}
```

Now we can actually call that when a button is pressed:

```javascript
    {...}
      <button
        onClick={() => {
          deleteFile(userId, file.id).then(() => mutate(userId));
        }}
        className="delete-button"
      >
        x
      </button>
    {...}
```

Great! Now let's get to the more difficult feature:

### Image uploads

The editor we're using, `rich-markdown-editor` has a prop called `uploadImage` which expects a promise that will resolve to string URL of the uploaded image. To this callback it'll provide the image as a JavaScript File object. For this we're going to have to setup a storage bucket in firebase. So let's head back to the console and click on Storage in the sidebar. Click the 'Get Started' button and create your bucket using whatever location you want. Once you're in we're again going to change our security rules but this time we'll allow reads from anyone but writes only from authenticated users. Here are the rules for that:

```javascript
rules_version = '2';
service firebase.storage {
    match /b/{bucket}/o {
        match /users/{userId}/{allImages=**} {
            allow read;
            allow write: if request.auth.uid == userId;
        }
    }
}
```

Like we did previously with firestore we need to create a reference to our storage bucket using our initialized firebase app so let's go back to firebase.js and do that:

```javascript
import 'firebase/storage'
export const store = firebaseApp.storage()
```

Great! Now we can import this reference in our code and use it to read or write to the store. So let's make a function that takes a File object and uploads it to the store:

```javascript
const uploadImage = async (file) => {
	const doc = await db
		.collection('users')
		.doc(userId)
		.collection('images')
		.add({
			name: file.name,
		})

	const uploadTask = await store
		.ref()
		.child(`users/${userId}/${doc.id}-${file.name}`)
		.put(file)

	return uploadTask.ref.getDownloadURL()
}
```

Ok so since firebase's storage offering doesn't have a way to upload files with a random unique name we're going to create a sub-collection for each user called images and then every time we upload an image we'll add it in there. After that completes we take that ID and add a hyphen and the original filename to it and then we upload it using the `ref.put` method that firebase storage provides. After the upload task completes we return it's URL using the `getDownloadURL` method.

Now all we need to do is provide this method as a prop to our editor:

```javascript
{...}
    <MarkdownEditor
        defaultValue={file.content}
        onChange={(getValue) => {
        setValue(getValue());
        }}
        uploadImage={uploadImage}
    />
{...}
```

Great! Look at us we've come so far. We have a half-decent markdown editor on hand add a few hundred lines of CSS and you'll have a full-fledged side project. But there are a few things that we can add easily to improve the general user experience, so let's get to them.

### General Improvements

So there are many things to improve but the first thing I wanted to handle was the fact that if you're not logged in & visit any of the pages it just errors out. So I added a `useEffect` hook where it'll redirect you back to the home page:

```javascript
useEffect(() => {
	if (!user) {
		navigate('/')
	}
}, [user])
```

Once that was out of the way I also wanted to give the user feedback when they had unsaved changes and tried to leave the page. This is accomplished using another `useEffect` hook so that we can add a listener to the `beforeunload` event:

```javascript
const onUnload = (event) => {
	event.preventDefault()
	event.returnValue = 'You have unsaved changes!'
	return 'You have unsaved changes!'
}

useEffect(() => {
	if (file && !(file.content === value)) {
		console.log('Added listener')
		window.addEventListener('beforeunload', onUnload)
	} else {
		window.removeEventListener('beforeunload', onUnload)
	}

	return () => window.removeEventListener('beforeunload', onUnload)
})
```

Pretty simple but in my opinion makes a significant difference. I also added a toasts using the amazing `react-toastify` packages to let the user when their changes have been saved or else when an error occurs:

```javascript
import { ToastContainer, toast } from "react-toastify";

const saveChanges = () => {
    {...}
    toast.success("🎉 Your changes have been saved!");
};

{...}
    <div>
        <div className="editor">
        <MarkdownEditor
            defaultValue={file.content}
            onChange={(getValue) => {
            setValue(getValue());
            }}
            uploadImage={uploadImage}
            onShowToast={(message) => toast(message)}
        />
        </div>
        <ToastContainer />
    </div>
{...}
```

And that's all for general tiny improvements, the toasts are perhaps a touch too much but I think they're pretty delightful (might remove it though).

### Conclusion

So I hope you were able to learn how amazing this stack for web applications is. Using SWR & Firebase with React makes for an amazing developer experience and also (because of the caching) gives the users a blazing fast user experience. You can see the final result at [https://typemd.now.sh](https://typemd.now.sh 'https://typemd.now.sh') & feel free to check out/fork the code from [the GitHub repo](https://github.com/kartiknair/typemd). Thanks for reading till the end of this super long post, I've been using twitter a lot more recently so feel free to say hello over there: [@nairkartik\_](https://twitter.com/nairkartik_). Stay safe ✌.
