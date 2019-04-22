import React, { Component } from "react";
import { TabBar, Tabs, Badge } from 'antd-mobile';
import { Link, Route, BrowserRouter, Redirect, withRouter } from 'react-router-dom';
import { renderRoutes } from 'react-router-config';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'

import * as actionMethod from '../action/index.js';

import Habit from '../component-container/habit.jsx';
import { Discover } from '../component-container/discover.jsx';
import { Favorite } from '../component-container/favorite.jsx';
import { My } from '../component-container/my.jsx';

// 没有模块化的样式可以全局共享，所以放在组件最外层
// 模块化只针对单个组件有效
import '../static/stylesheet/index.css';
import '../static/stylesheet/normal.css';
import '../static/fonts/iconfont.css';
class wrap extends Component {
    constructor(props) {
        super(props);
        // let tab = props.location.pathname.replace("/", "")
        // this.state = {
        //     selectedTab: 'discover',
        // }
    }
    componentDidMount() {
        let {
            async_isLogin,
            store_habitData
        } = this.props.actionMethod;
        let token = window.localStorage.getItem("token");

        // 这里集中处理websocket广播回来的数据
        var socket = io('http://127.0.0.1:3008', {});

        socket.on('connect', (d) => {
            // console.log('socketId:' + socket.id)
        })

        socket.on('message', (msg) => {
            if (msg.reBook) {
                store_habitData({
                    data: {
                        isUpdate: true,
                        reBook: msg.reBook
                    }
                })
            }
            // console.log(msg)
        })

        async_isLogin({
            data: {
                token: token
            }
        })
        this.getRecord()
    }
    componentDidUpdate() {
        let {
            isLogin
        } = this.props.userinfo;
        let {
            tempRecord,
            isHaveDate
        } = this.props.record;

        if (!isLogin) {
            this.props.history.replace('/entry')
        }
        if (tempRecord && tempRecord.length <= 0 && isHaveDate === '1') {
            // console.log(tempRecord)
        }
    }
    onTab(tab) {
        let {
            store_recordData
        } = this.props.actionMethod;
        setTimeout(() => {
            store_recordData({
                data: {
                    type: '-',
                    isHaveDate: '1',
                    recordList: [],
                    bottomTab: tab
                }
            })
        }, 0)
        this.setState({
            selectedTab: this.props.record.bottomTab
        }, () => {
            if (this.state.selectedTab === 'my') { }
        })
    }
    getRecord() {
        let {
            async_getRecord
        } = this.props.actionMethod;
        let {
            tabIndex,
        } = this.props.record;
        let userId = window.localStorage.getItem("userId");

        if (this.props.record.bottomTab === 'discover') {
            if (tabIndex === 1) {
                async_getRecord({
                    userId,
                    lastRecord: '',
                    type: 'getNewRecord'
                })
            } else if (tabIndex === 0) {
                async_getRecord({
                    userId,
                    lastRecord: '',
                    type: 'getHotRecord'
                })
            } else {

            }
        }
    }

    render() {
        return (
            <div style={{ position: 'fixed', height: '100%', width: '100%', bottom: 0 }}>
                {/* <Route exact path="/" render={() => (
                    <Redirect to="/my" />
                )} /> */}
                <Route exact path="/" />
                <TabBar
                    unselectedTintColor="#999"
                    tintColor="#06C1AE"
                    barTintColor="white"
                    hidden={false}
                >

                    {/* 习惯 */}
                    <TabBar.Item
                        title="习惯"
                        key="habit"
                        icon={<div style={{
                            width: '24px',
                            height: '24px',
                            background: 'url(https://i.loli.net/2019/04/22/5cbd85df35ea5.png) center center /  20px 20px no-repeat'

                        }}
                        />
                        }
                        selectedIcon={<div style={{
                            width: '24px',
                            height: '24px',
                            background: 'url(https://i.loli.net/2019/04/23/5cbdfae97849f.png) center center /  24px 24px no-repeat',
                            filter: 'drop-shadow(24px 0 #06C1AE)',
                            position: 'relative',
                            left: '-24px'
                        }}
                        />
                        }
                        selected={this.props.record.bottomTab === 'habit'}
                        // badge={1}
                        onPress={() => {
                            this.onTab('habit')
                        }}
                        data-seed="logId"
                    >
                        {<Habit />}
                        {renderRoutes(this.props.route.routes)}
                    </TabBar.Item>

                    {/* 发现 */}
                    <TabBar.Item
                        title="发现"
                        key="discover"
                        badge={''}
                        icon={<div style={{
                            width: '24px',
                            height: '24px',
                            background: 'url(https://i.loli.net/2019/04/23/5cbdfce9b8106.png) center center /  20px 20px no-repeat'
                        }}
                        />
                        }
                        selectedIcon={<div style={{
                            width: '24px',
                            height: '24px',
                            background: 'url(https://i.loli.net/2019/04/23/5cbdfae99d2a8.png) center center /  24px 24px no-repeat',
                            filter: 'drop-shadow(24px 0 #06C1AE)',
                            position: 'relative',
                            left: '-24px'
                        }}
                        />
                        }
                        selected={this.props.record.bottomTab === 'discover'}
                        // badge={1}
                        onPress={() => {
                            this.onTab('discover')
                        }}
                        data-seed="logId1"
                    >
                        {<Discover />}
                    </TabBar.Item>

                    {/* 收藏 */}
                    <TabBar.Item
                        title="收藏"
                        key="favorite"
                        badge={''}
                        icon={<div style={{
                            width: '24px',
                            height: '24px',
                            background: 'url(https://i.loli.net/2019/04/22/5cbd85df35f42.png) center center /  20px 20px no-repeat'
                        }}
                        />
                        }
                        selectedIcon={<div style={{
                            width: '24px',
                            height: '24px',
                            background: 'url(https://i.loli.net/2019/04/23/5cbdfae985bbc.png) center center /  24px 24px no-repeat',
                            filter: 'drop-shadow(24px 0 #06C1AE)',
                            position: 'relative',
                            left: '-24px'
                        }}
                        />
                        }
                        selected={this.props.record.bottomTab === 'favorite'}
                        onPress={() => {
                            this.onTab('favorite')
                        }}
                    >
                        {<Favorite />}
                    </TabBar.Item>

                    {/* 我的 */}
                    <TabBar.Item
                        icon={
                            <div style={{
                                width: '24px',
                                height: '24px',
                                background: 'url(https://i.loli.net/2019/04/22/5cbd85df1c5f9.png) center center /  20px 20px no-repeat'
                            }}
                            />}
                        selectedIcon={
                            <div style={{
                                width: '24px',
                                height: '24px',
                                background: 'url(https://i.loli.net/2019/04/23/5cbdfae96e950.png) center center /  24px 24px no-repeat',
                                filter: 'drop-shadow(24px 0 #06C1AE)',
                                position: 'relative',
                                left: '-24px'
                            }}
                            />
                        }
                        title="我的"
                        key="my"
                        badge={0}
                        selected={this.props.record.bottomTab === 'my'}
                        onPress={() => {
                            this.onTab('my')
                        }}
                    >
                        <My />
                    </TabBar.Item>
                </TabBar>

            </div>
        );
    }

}
const mapStateToProps = (state) => {
    let {
        userinfo,
        record
    } = state
    return { userinfo, record };
}
const mapDispatchToProps = (dispath) => {
    return {
        actionMethod: bindActionCreators(actionMethod, dispath)
    }
}
const wrap_withRouter = withRouter(wrap)
const Wrap = connect(
    mapStateToProps,
    mapDispatchToProps
)(wrap_withRouter)
export { Wrap }