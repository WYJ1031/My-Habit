


// import { Link, Route, BrowserRouter, Switch } from 'react-router-dom';
// import { asyncComponent } from "../static/javascript/asyncComponent.js"

import {Wrap} from '../component-container/wrap.jsx';
import { Book } from '../component-container/book/index.jsx';
import  {ItemRecords}  from '../component-container/pubic-item-habit/index.jsx';
import  {AddHabit}  from '../component-container/add-habit/index.jsx';
import  {Entry}  from '../component-container/entry/index.jsx';

export default [
    {
        path: '/',
        exact:true,
        component: Wrap
    },
    {
        path: '/entry',
        component: Entry
    },
    {
        path: '/record/:id',
        component: ItemRecords
    },
    {
        path: '/habit/book/:id',
        component: Book,
    },
    {
        path: '/habit/add',
        component: AddHabit
    },
    {
        path: '/habit',
        component: Wrap
    },
    {
        path: '/discover',
        component: Wrap
    },
    {
        path: '/favorite',
        component: Wrap
    },
    {
        path: '/my',
        component: Wrap
    }
]
