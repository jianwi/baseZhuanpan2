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