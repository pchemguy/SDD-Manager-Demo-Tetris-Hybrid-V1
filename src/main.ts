import './styles.css';
import { createTetrisApp } from './app.ts';

/**
 * Production entry point (C7).
 * Mounts the Tetris application into #app when running in a browser document.
 */
const root = document.getElementById('app');
createTetrisApp(root);
