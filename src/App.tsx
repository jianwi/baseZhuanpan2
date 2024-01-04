import "./App.css";
import {useEffect, useMemo, useRef, useState} from "react";
import {
    bitable, IGridView, FilterOperator, FieldType, IFilterBaseCondition, IFilterTextCondition, IFilterNumberCondition,
    IFilterDateTimeCondition,
    IFilterDateTimeValue,
} from "@lark-base-open/js-sdk";
import {Banner, Button, Card, Col, DatePicker, Input, Modal, Row, Select, Space, Table, Toast} from "@douyinfe/semi-ui";


export default function App() {
    const baseInfo = useRef({
        baseId: "",
        zpInfo: {},
        tables: [],
        zpWeb: null
    })

    async function checkStore() {
        // 获取当前的appToken
        let currentSelection = await bitable.base.getSelection()
        console.log("currentSelection", currentSelection)
        baseInfo.current.baseId = currentSelection.baseId

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
                // 获取转盘信息
                if (type === "getZpInfo") {
                    let zpInfo = await bitable.bridge.getData("zpInfo")
                    event.source.postMessage({
                        from: "base_zp001",
                        zpInfo
                    }, event.origin);
                    return
                }
                if (type === "getTables") {
                    let tables = await bitable.base.getTableMetaList()
                    event.source.postMessage({
                        from: "base_zp001",
                        data: tables
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
        let zp = window.open("http://localhost:3000/")
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
        {/lark/i.test(uaString) && <BannerTip/>}
        <div>{}</div>
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
            padding: "10px 20px"
        }}>
            <Button size={'large'} theme={'solid'} onClick={toZP}>打开大转盘</Button>
        </div>
        <div style={{
            background:"#f7f8f8",
            padding: 20,
            fontSize:14,
        }}>
            <div style={{textAlign:"center",fontWeight:500}}>请点击【打开大转盘】按钮开始使用</div>
            {/*<div style={{textAlign:"center",margin:10,color:"#1c90ff"}}>点击【打开大转盘】按钮开始使用</div>*/}
            <div style={{padding: "10px", margin: "auto", width: "fit-content", marginTop: 20}}>
                <div style={{margin: 5}}>使用转盘时不要关闭此页面</div>
                <div style={{margin: 5}}>转盘必须从当前页面打开</div>
                <div style={{margin: 15, textAlign:"center"}}>不然无法保存转盘</div>
                <div style={{marginTop: "25px", textAlign:"center"}}>
                    <a target={'_blank'} href={'https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=5f5rf10b-bf22-433b-af81-17da47806c01'}>加入"转盘插件"讨论群</a>
                </div>
            </div>

        </div>


    </div>)

}

