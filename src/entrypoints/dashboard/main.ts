import { mount } from 'svelte';
import Dashboard from './Dashboard.svelte';
// import './app.css';
import "@/assets/tailwind.css";

const app = mount(Dashboard, {
  target: document.getElementById('app')!,
});

export default app;
