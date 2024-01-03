import "./App.css";
import {useEffect, useMemo, useRef, useState} from "react";
import {
    bitable, IGridView, FilterOperator, FieldType, IFilterBaseCondition, IFilterTextCondition, IFilterNumberCondition,
    IFilterDateTimeCondition,
    IFilterDateTimeValue,
} from "@lark-base-open/js-sdk";
import {Button, Card, Col, DatePicker, Input, Modal, Row, Select, Space, Table, Toast} from "@douyinfe/semi-ui";
import {IconAlarm, IconConnectionPoint1, IconCrossStroked, IconDelete, IconMinus, IconSend} from "@douyinfe/semi-icons";
import {useTranslation} from "react-i18next";
import {getFilterOperatorMap} from "./utils";


export default function App() {
    const [resultTableId, setResultTableId] = useState("")
    const baseInfo = useRef({
        baseId: "",
        zpInfo: {},
        resultTableId: "",
        tables: [],
        zpWeb: null
    })

    async function checkStore() {
        // 获取当前的appToken
        let currentSelection = await bitable.base.getSelection()
        console.log("currentSelection", currentSelection)
        baseInfo.current.baseId = currentSelection.baseId

        // 检查有无 result 表
        let resultTableId = await bitable.bridge.getData("resultTableId")
        if (resultTableId) {
            // 判断 result 表是否存在
            let r = await bitable.base.getTableById(resultTableId)
            console.log(r)
            setResultTableId(r.id)
        } else {

        }
    }

    useEffect(() => {
        checkStore()
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
                    let resultTable = await bitable.bridge.getData("resultTable")
                    console.log("resultTable", resultTable)
                    if (Object.values(resultTable).length === 0) {
                        console.log("创建表")
                        // 创建表
                        let table = await bitable.base.addTable({
                            name: "转盘结果" + (Date.now() % 1000000).toString(30),
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
                        await bitable.bridge.setData("resultTable", table)
                        resultTable = table
                    }
                    // 写入数据
                    let tableObj = await bitable.base.getTableById(resultTable.tableId)
                    let fields = await tableObj.getFieldMetaList()
                    console.log(fields)
                    // await tableObj
                    let nameObjMap = {}
                    for (let field of fields) {
                        nameObjMap[field.name] = field.id
                    }
                    if (!nameObjMap["转盘名称"] || !nameObjMap['抽奖结果']) {
                        await bitable.bridge.setData("resultTable", {})
                        return
                    }
                    await tableObj.addRecord({
                      fields: {
                          [nameObjMap['转盘名称']]: zpTitle,
                          [nameObjMap['抽奖结果']]: resultText
                      }
                    })

                    if (!baseInfo.current.resultTableId) {
                        // 创建表
                    }
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

            }
        }
        window.addEventListener('message', check);
        return () => {
            window.removeEventListener('message', check);
        }

    }, []);


    const toZP = () => {
        let zp = window.open("http://qzp.cm321.cn/")
        baseInfo.current.zpWeb = zp
        zp.postMessage({
            from: "base_zp001",
            data: baseInfo.current
        }, 'http://localhost:3000');
    }

    function TipResultTable() {
        return <>您已创建 转盘结果表，请不要修改字段名称 和 删除字段</>
    }

    return (<div>
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "90vh",
            padding: "10px 20px"
        }}>
            <Button size={'large'} theme={'solid'} onClick={toZP}>打开大转盘</Button>
        </div>

    </div>)

}

