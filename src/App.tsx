import "./App.css";
import {useEffect, useMemo, useRef, useState} from "react";
import {
    bitable, IGridView, FilterOperator, FieldType, IFilterBaseCondition, IFilterTextCondition, IFilterNumberCondition,
    IFilterDateTimeCondition,
    IFilterDateTimeValue,
} from "@lark-base-open/js-sdk";
import {Banner, Button, Card, Col, DatePicker, Input, Modal, Row, Select, Space, Table, Toast} from "@douyinfe/semi-ui";
import {getNames, getPrize, getPrizesTable, getZpResultTable, getTableRecords, getZpResults} from "./utils";

const zpLink = "https://webzp2.cm321.cn"
export default function App() {
    const baseInfo = useRef({
        baseId: "",
        zpInfo: {},
        tables: [],
        zpWeb: null
    })


    async function getZpInfo(){
        let names = await getNames()
        console.log("names----",names)
        let prizes = await getPrize()
        console.log("prize----",prizes)
        let results = await getZpResults()
        console.log("results---", results)
        return {
            names,
            prizes,
            results
        }
    }



    async function addResult(name, prize){
        let table = await getZpResultTable()
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
                let sid = data.sid
                // console.log("消息类型", type)

                if (type === "getNames"){
                    let names = await getNames()
                    console.log(names)
                    event.source.postMessage({
                        from: "base_zp001",
                        names,
                        sid
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
                    let {names, prizes,results} = await getZpInfo()
                    event.source.postMessage({
                        from: "base_zp001",
                        zpInfo: {
                            names,
                            prizes,
                            results
                        },
                        sid,
                    }, event.origin);
                    return
                }
                if (type === "addResult") {
                    let {name, prize} = data
                    console.log("添加结果", name, prize)
                    await addResult(name, prize)

                    event.source.postMessage({
                        from: "base_zp001",
                        data:"ok",
                        sid
                    }, event.origin);
                    return
                }
                if (type === "checkAlive"){
                    event.source.postMessage({
                        from: "base_zp001",
                        data: "success",
                        sid
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
        let zp = window.open(zpLink)
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
        }} src={zpLink} frameBorder={0}></iframe>

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

