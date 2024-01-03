import "./App.css";
import {useEffect, useMemo, useState} from "react";
import {bitable, IGridView, FilterOperator, FieldType, IFilterBaseCondition, IFilterTextCondition, IFilterNumberCondition,
    IFilterDateTimeCondition,
    IFilterDateTimeValue,
} from "@lark-base-open/js-sdk";
import {Button, Card, Col, DatePicker, Input, Modal, Row, Select, Space, Table, Toast} from "@douyinfe/semi-ui";
import {IconAlarm, IconConnectionPoint1, IconCrossStroked, IconDelete, IconMinus, IconSend} from "@douyinfe/semi-icons";
import {useTranslation} from "react-i18next";
import {getFilterOperatorMap} from "./utils";




export default function App() {
    useEffect(() => {

        fn()

    }, []);

    async function fn() {
        let r = await bitable.bridge.setData("11","22")
        console.log(r)

        let xx = await bitable.bridge.getData("11")
        console.log("zxx", xx)

    }


    const toZP = () => {
        let zp = window.open("http://localhost:3000")
        zp.postMessage('Hello there!', 'http://localhost:3000');
        setInterval(()=>{
            zp.postMessage({
                "type": "base",
                "from": "base",
                "xxx": "xxx",
            }, 'http://localhost:3000');
        },1000)
    }

    return (<div>
        <Button  onClick={fn}>打开</Button>

    </div>)

}

