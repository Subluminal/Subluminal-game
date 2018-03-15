import Vue from 'vue'
import Router from 'vue-router'
import Main from '@/components/Main'
import Latex from '@/components/Latex'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Main',
      component: Main
    },
    {
      path: '/latex',
      name: 'Latex',
      component: Latex

    }
  ],
})
