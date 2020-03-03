import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import * as serviceWorker from './serviceWorker';

//locate first <meetings> element
const [element] = document.getElementsByTagName('meetings');

if (element) {
  ReactDOM.render(<App />, element);
} else {
  console.warn('Could not find a <meetings> element in your HTML');
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
