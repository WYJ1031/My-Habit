
import React, { Component } from "react";
import { Popover, NavBar, Icon, Button, List } from 'antd-mobile';
import { Link, withRouter } from 'react-router-dom';
import style from './myCenter.css';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux';
import * as actionMethod from '../../action/index.js';
// import moment from 'moment'
class mycenter extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userName: '',
        };
        this.getRecord = this.getRecord.bind(this)
    }
    componentDidMount() {
        this.state.userName = window.localStorage.getItem('userName')
        // console.log('11', this.props);
        // this.getRecord();
    }

    componentDidUpdate() {
        let {
            tempRecord,
            isHaveDate
        } = this.props.record;
        if (tempRecord && tempRecord.length <= 0 && isHaveDate === '1') {
            this.getRecord()
        }
    }

    getRecord() {
        let {
            async_getRecord
        } = this.props.actionMethod;
        // let {
        //     id: habitId
        // } = this.props.match.params;
        // let {
        //     tempRecord
        // } = this.props.record;
        let userId = window.localStorage.getItem("userId");
        // let lastRecord = tempRecord.length > 0 ? tempRecord[tempRecord.length - 1]._id : ''

        // async_getRecord({
        //     userId,
            // habitId,
            // lastRecord,
        //     type: 'myCollect'
        // })
    }

    habitList() {
        let showList = this.props.habit.habitInfo.map((item, index) => {
            return (
                <List.Item
                    key={index}
                    className="per-habit-item"
                    arrow=""
                    thumb={<div className="iconfont icon-marketing_fill"></div>}
                    multipleLine
                    onClick={() => { }}
                >
                    {/* <Link to={`/record/${item.habit._id}/`}> */}
                    <div>
                        <div className="per-habit-name">{item.habit.habitName}</div>
                        {
                            (item.habit.userCount == 1) ?
                            (
                                <List.Item.Brief className="per-habit-brief">目前只有你加入哦，快叫上其他小伙伴~</List.Item.Brief>
                            ) :
                            (
                                <List.Item.Brief className="per-habit-brief">有{item.habit.userCount}个小伙伴在一起哦~</List.Item.Brief>
                            )

                        }
                    </div>
                    {/* </Link> */}
                </List.Item>
            )
        })
        return showList;
    }

    render() {
        let {
            tempRecord
        } = this.props.record;
        // console.log(tempRecord);
        // 积分
        let count = 0;
        this.props.habit.habitInfo.map((item) => {
            count += item.habit.userCount;
        })
        return (
            <div className={`${style.wrap}`}
            style={{position:'relative'}}
             >
                
                <div className={`${style.header}`}>
                    <div className={`${style.picWrap}`}>
                        <div className={`${style.pic}`}>
                            <img src="http://tjoe18.cn/logo.png" />
                        </div>
                    </div>

                    <div className={`${style.attention}`}>
                        <p>Hello：<span>{ this.state.userName }</span></p>
                        <p></p>
                    </div>
                </div>
                <p className={`${style.introduce}`}>
                    {
                        count === 0 ?
                        (<span>你还没有积分哦~快去养成个好习惯！</span>) :
                        (<span>你的积分是：<span className={`${style.high}`}>{count}分！</span>越多好伙伴加入积分越高哦~</span>)
                    }
                </p>

                <div className={`${style.otherHabit} otherHabit`}>
                    <h3 className={`${style.title}`}>我的习惯记录</h3>
                    <List>
                        {this.habitList()}
                    </List>
                </div>
            </div>
        )
    }
}
const mapStateToProps = (state) => {
    let {
        userinfo,
        habit,
        record
    } = state
    return { userinfo, habit, record };
}
const mapDispatchToProps = (dispath) => {
    return {
        actionMethod: bindActionCreators(actionMethod, dispath)
    }
}
const my_center = withRouter(mycenter)
const MyCenter = connect(
    mapStateToProps,
    mapDispatchToProps
)(my_center)
export { MyCenter }