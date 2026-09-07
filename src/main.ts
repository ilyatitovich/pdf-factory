import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const appContianer = document.getElementById('app')

if (!appContianer) {
  throw new Error('App element not found')
}

export default mount(App, {
  target: appContianer
})
