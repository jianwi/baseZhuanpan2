import "./App.css";
import {useEffect, useMemo, useRef, useState} from "react";
import {
    bitable, IGridView, FilterOperator, FieldType, IFilterBaseCondition, IFilterTextCondition, IFilterNumberCondition,
    IFilterDateTimeCondition,
    IFilterDateTimeValue,
} from "@lark-base-open/js-sdk";
import {Banner, Button, Card, Col, DatePicker, Input, Modal, Row, Select, Space, Table, Toast} from "@douyinfe/semi-ui";
import {getTableRecords} from "./utils";

export default function App() {
    const baseInfo = useRef({
        baseId: "",
        zpInfo: {},
        tables: [],
        zpWeb: null
    })

    async function getNames() {
        let tableName = "抽奖人员"
        let table
        try {
            table = await bitable.base.getTableByName(tableName)
        } catch (e) {
            console.error("获取表失败", e)
        }
        if (!table) {
            console.log("创建表")
            // 创建表
            await bitable.base.addTable({
                name: tableName,
                fields: [
                    {
                        name: "ID",
                        type: FieldType.AutoNumber,

                    },
                    {
                        name: "人员",
                        type: FieldType.Text
                    },
                    {
                        name: "抽中奖品",
                        type: FieldType.Formula
                    },
                    {
                        name: "修改人",
                        type: FieldType.ModifiedUser
                    },
                    {
                        name: "修改时间",
                        type: FieldType.ModifiedTime
                    }
                ]
            })
            table = await bitable.base.getTableByName(tableName)
        }

        // 获取items
        let names = []
        let records = await getTableRecords(table,{})
        if (records.length > 0){
            for (let record of records){
                if (record["抽中奖品"] && record["抽中奖品"].value){
                    continue
                }

                let nameInfo = record["人员"]
                if (!nameInfo){
                    throw new Error("人员字段不存在")
                }
                if (nameInfo.value){
                    if (nameInfo.value[0]){
                        let name = nameInfo.value[0].name || nameInfo.value[0].text
                        if (name) names.push(name)
                    }
                }
            }
        }
        return names
    }

    async function getPrize(){
        let tableName = "奖项"
        let table
        try {
            table = await bitable.base.getTableByName(tableName)
        } catch (e) {
            console.error("获取表失败", e)
        }
        if (!table) {
            console.log("创建表")
            // 创建表
            await bitable.base.addTable({
                name: tableName,
                fields: [
                    {
                        name: "奖项名称",
                        type: FieldType.Text,

                    },
                    {
                        name: "总数",
                        type: FieldType.Number
                    },
                    {
                        name: "剩余数量",
                        type: FieldType.Formula
                    },
                    {
                        name: "已中数量",
                        type: FieldType.Formula
                    }
                ]
            })
            table = await bitable.base.getTableByName(tableName)
        }
        // 获取items
        let prizes = []
        let records = await getTableRecords(table)
        console.log("records",records)
        if (records.length > 0){
            for (let record of records){
                console.log(record)
                if (record["剩余数量"].value < 1){
                    console.log(record["剩余数量"].value)
                    continue
                }
                let info = {}
                if (record["奖项名称"] && record["奖项名称"].value){
                    info["奖项名称"] = record["奖项名称"].value[0].text
                    if (record["剩余数量"] && record["剩余数量"].value){
                        info["剩余数量"] = record["剩余数量"].value
                        prizes.push(info)
                    }
                }
            }
        }
        return prizes
    }

    async function addResult(name, prize){
        let tableName = "抽奖记录"
        let table
        try {
            table = await bitable.base.getTableByName(tableName)
        } catch (e) {
            console.error("获取表失败", e)
        }
        if (!table) {
            console.log("创建表")
            // 创建表
            await bitable.base.addTable({
                name: tableName,
                fields: [
                    {
                        name: "ID",
                        type: FieldType.AutoNumber,

                    },
                    {
                        name: "人员",
                        type: FieldType.Text
                    },
                    {
                        name: "奖项",
                        type: FieldType.Text
                    },
                    {
                        name: "修改人",
                        type: FieldType.ModifiedUser
                    },
                    {
                        name: "修改时间",
                        type: FieldType.ModifiedTime
                    }
                ]
            })
            table = await bitable.base.getTableByName(tableName)
        }
        // 写入数据
        let getNameIdMap = async function (){
            // @ts-ignore
            let fields = await table.getFieldMetaList()
            console.log(fields)
            // await tableObj
            let nameObjMap = {}
            for (let field of fields) {
                nameObjMap[field.name] = field.id
            }
            return nameObjMap
        }
        let nameObjMap = await getNameIdMap()

        if (!nameObjMap["人员"]) {
            // 添加 转盘名称 字段
            await table.addField({
                name: "人员",
                type: FieldType.Text
            })
            nameObjMap = await getNameIdMap()
        }
        if (!nameObjMap["奖项"]){
            // 添加 转盘结果 字段
            await table.addField({
                name: "奖项",
                type: FieldType.Text
            })
            nameObjMap = await getNameIdMap()
        }


        await table.addRecord({
            fields: {
                [nameObjMap['人员']]: name,
                [nameObjMap['奖项']]: prize
            }
        })
    }


    const [uaString, setUaString] = useState("")
    const checkApi = async () => {
        try {
            let userAgentString = navigator.userAgent;
            setUaString(userAgentString)
        }catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        checkApi()
    }, []);

    useEffect(() => {
        let check = async function (event) {
            if (event.data && event.data.from && event.data.from === "qzpWeb1") {
                let type = event.data.type
                let data = event.data
                console.log("消息类型", type)
                if (type === "getNames"){
                    let names = await getNames()
                    console.log(names)
                    event.source.postMessage({
                        from: "base_zp001",
                        names
                    }, event.origin);
                    return
                }
                if (type === 'getPrizes'){
                    let prizes = await getPrize()
                    console.log(prizes)
                    return prizes
                }
                // 获取转盘信息
                if (type === "getZpInfo") {
                    let names = await getNames()
                    let prizes = await getPrize()
                    event.source.postMessage({
                        from: "base_zp001",
                        zpInfo: {
                            names,
                            prizes
                        }
                    }, event.origin);
                    return
                }
                if (type === "addResult") {
                    let {name, prize} = data
                    console.log("添加结果", name, prize)
                    await addResult(name, prize)

                    event.source.postMessage({
                        from: "base_zp001",
                        data:"ok"
                    }, event.origin);
                    return
                }
                if (type === "addResult") {
                    let resultText = data.result
                    let zpTitle = data.title
                    console.log("添加结果", resultText)
                    let tableName = "转盘抽奖记录"
                    let resultTable
                    try {
                        resultTable = await bitable.base.getTableByName(tableName)
                    }catch (e) {
                        console.error("获取表失败",e)
                    }
                    if (!resultTable) {
                        console.log("创建表")
                        // 创建表
                        await bitable.base.addTable({
                            name: tableName,
                            fields: [
                                {
                                    name: "ID",
                                    type: FieldType.AutoNumber,

                                },
                                {
                                    name: "转盘名称",
                                    type: FieldType.Text
                                },
                                {
                                    name: "抽奖结果",
                                    type: FieldType.Text
                                },
                                {
                                    name: "创建人",
                                    type: FieldType.CreatedUser
                                },
                                {
                                    name: "创建时间",
                                    type: FieldType.CreatedTime
                                },
                                {
                                    name: "修改人",
                                    type: FieldType.ModifiedUser
                                },
                                {
                                    name: "修改时间",
                                    type: FieldType.ModifiedTime
                                }
                            ]
                        })
                        resultTable = await bitable.base.getTableByName(tableName)
                    }
                    // 写入数据
                    let getNameIdMap = async function (){
                        // @ts-ignore
                        let fields = await resultTable.getFieldMetaList()
                        console.log(fields)
                        // await tableObj
                        let nameObjMap = {}
                        for (let field of fields) {
                            nameObjMap[field.name] = field.id
                        }
                        return nameObjMap
                    }
                    let nameObjMap = await getNameIdMap()

                    if (!nameObjMap["转盘名称"]) {
                        // 添加 转盘名称 字段
                        await resultTable.addField({
                            name: "转盘名称",
                            type: FieldType.Text
                        })
                        nameObjMap = await getNameIdMap()
                    }
                    if (!nameObjMap["抽奖结果"]){
                        // 添加 转盘结果 字段
                        await resultTable.addField({
                            name: "抽奖结果",
                            type: FieldType.Text
                        })
                        nameObjMap = await getNameIdMap()
                    }

                    await resultTable.addRecord({
                      fields: {
                          [nameObjMap['转盘名称']]: zpTitle,
                          [nameObjMap['抽奖结果']]: resultText
                      }
                    })

                    return
                }
                if (type === "setZpInfo") {
                    let zpInfo = data.zpInfo
                    await bitable.bridge.setData("zpInfo", zpInfo)
                    // 保存成功
                    event.source.postMessage({
                        from: "base_zp001",
                        data: "success"
                    }, event.origin);
                    return
                }
                if (type === "checkAlive"){
                    event.source.postMessage({
                        from: "base_zp001",
                        data: "success"
                    }, event.origin);
                    return
                }
            }
        }
        window.addEventListener('message', check);
        return () => {
            window.removeEventListener('message', check);
        }

    }, []);


    const toZP = () => {
        let zp = window.open("https://webzp2.cm321.cn")
        baseInfo.current.zpWeb = zp
        zp.postMessage({
            from: "base_zp001",
            data: baseInfo.current
        }, 'http://localhost:3000');
    }

    function BannerTip() {
        return <Banner description={<>
            飞书客户端暂不支持保存转盘信息，请在浏览器中使用此插件。
        </>}></Banner>
    }

    return (<div>
        {/*{/lark/i.test(uaString) && <BannerTip/>}*/}

        <iframe style={{
            width:"100vw",
            height: "80vh"
        }} src={'http://127.0.0.1:3000'} frameBorder={0}></iframe>

        <div style={{
            textAlign:"center"
        }}>
            <Button onClick={()=>{
                if (/lark/i.test(uaString) ) {
                    bitable.ui.showToast({
                        message:"请在浏览器中使用，飞书客户端不支持哦！"
                    })
                    return
                }
                toZP()

            }}>大屏打开</Button>

        </div>


    </div>)

}

