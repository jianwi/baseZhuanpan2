import {bitable, FieldType} from "@lark-base-open/js-sdk";

export async function getTableRecords(table, param={}) {
    let fields = await table.getFieldMetaList()
    let namesMap = {}
    for (let field of fields) {
        namesMap[field.id] = {
            id: field.id,
            type: field.type,
            name: field.name
        }
    }
    let records = await table.getRecords(param)
    if (records.records && records.records.length > 0){
        records.records = records.records.map(item => {
            let fields = item.fields
            let info = {}
            for (let [k, v] of Object.entries(fields)) {
                info[namesMap[k].name] = {
                    value: v,
                    type: namesMap[k].type
                }
            }
            return info
        })
        return records.records
    }
    return []
}



export async function getNamesTable(){
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
                    name: "手动输入人员",
                    type: FieldType.Text
                },
                {
                    name: "人员",
                    type: FieldType.Formula
                },
                {
                    name: "抽中奖品",
                    type: FieldType.Formula
                },
                {
                    name: "签到人员",
                    type: FieldType.CreatedUser
                },
                {
                    name: "收货地址",
                    type: FieldType.Text
                },
                {
                    name: "手机号",
                    type: FieldType.Number
                }
            ]
        })
        table = await bitable.base.getTableByName(tableName)
        let fieldPeople = await table.getFieldByName("人员")
        await fieldPeople.setFormula("IFBLANK([手动输入人员],[签到人员])")
        let fieldPrize = await table.getFieldByName("抽中奖品")
        await fieldPrize.setFormula("[抽奖记录].FILTER(CurrentValue.[人员]=[人员]).[奖项]")
    }
    return table
}

export async function getPrizesTable(){
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
        let fieldLeft = await table.getFieldByName("剩余数量")
        await fieldLeft.setFormula("[总数]-[已中数量]")
        let fieldZpResult = await table.getFieldByName("已中数量")
        await fieldZpResult.setFormula("COUNTA([抽奖记录].FILTER(CurrentValue.[奖项]=[奖项名称]).[ID])")
    }
    return table
}

export async function getZpResultTable(){
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
    return table
}


export async function getNames() {
    let table = await getNamesTable()
    // 获取items
    let names = []
    let records = await getTableRecords(table,{})
    if (records.length > 0){
        for (let record of records){
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

export async function getPrize(){
    let table = await getPrizesTable()
    // 获取items
    let prizes = []
    let records = await getTableRecords(table)
    if (records.length > 0){
        for (let record of records){
            if (record["剩余数量"].value < 1){
                continue
            }
            let info = {}
            if (record["奖项名称"] && record["奖项名称"].value){
                info["奖项名称"] = record["奖项名称"].value[0].text
                if (record["总数"] && record["总数"].value){
                    info["总数"] = record["总数"].value
                    prizes.push(info)
                }
            }
        }
    }
    return prizes
}

export async function getZpResults() {
    let table = await getZpResultTable()
    // 获取items
    let records = await getTableRecords(table)
    let results = []
    if (records.length > 0){
        for (let record of records){
            let info = {}
            if (record["人员"] && record["人员"].value){
                info["人员"] = record["人员"].value[0].text
                if (record["奖项"] && record["奖项"].value){
                    info["奖项"] = record["奖项"].value[0].text
                    results.push(info)
                }
            }
        }
    }
    return results
}