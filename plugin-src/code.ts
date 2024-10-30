import { arrayToNestedObject } from "./lib"
import type { Mode } from "./types"

const VARIABLE_ALIAS = "VARIABLE_ALIAS"

const _findAiliasVariables = async (mode: Mode, collectionModes: Mode[], variable: VariableAlias) => {
	let variableId = variable.id
	let value: any = ""
	let next = false

	do {
		const _variable = await figma.variables.getVariableById(variableId)

		if (!_variable) break

		const variableMode = collectionModes.find((m) => !!_variable.valuesByMode[m.modeId])

		if (!variableMode) break

		const variable: any = _variable.valuesByMode[variableMode.modeId]

		if (variable.id) variableId = variable.id

		if (variable.type !== VARIABLE_ALIAS) {
			next = false
		} else if (variable.r) {
			next = false
		} else {
			next = true
		}

		if (!next) value = variable
	} while (next)

	return value
}

// モード毎の変数を取得
const _getVariablesByMode = async (
	mode: Mode,
	collectionModes: Mode[],
	variables: Variable[]
) => {
	const data = []

	for (const variable of variables) {
		let value: string | number | boolean | RGB | RGBA = ""
		const _variable = variable.valuesByMode[mode.modeId]

		if (typeof _variable === "object" && "type" in _variable) {
			if (_variable.type === VARIABLE_ALIAS) {
				const ailiasVariable = await _findAiliasVariables(mode, collectionModes, _variable)

				value = ailiasVariable
			}
		} else {
			value = _variable
		}

		data.push({
			id: variable.id,
			name: variable.name,
			type: variable.resolvedType,
			value,
			mode
		})
	}

	return data
}

figma.showUI(__html__, {
	height: 440
})

figma.on("run", async () => {
	const collections = await figma.variables.getLocalVariableCollections()
	const variables = await figma.variables.getLocalVariables()

	figma.ui.postMessage({
		type: "getVariableCollections",
		data: collections.map((collection) => {
			const _variables = variables.filter(v => v.variableCollectionId === collection.id)
			const count = _variables.length
			const types = Array.from(new Set(_variables.map(v => v.resolvedType)))
			const typeCount = (typeName: string) => _variables.filter(v => v.resolvedType === typeName).length

			return {
				name: collection.name,
				key: collection.key,
				count,
				types: types.map((type) => ({
					name: type,
					count: typeCount(type)
				}))
			}
		})
	})
})

figma.ui.onmessage = async (props) => {
	const content: {
		[key: string]: any
	} = {}
	const collections = await figma.variables.getLocalVariableCollections()
	const collectionVariables = await figma.variables.getLocalVariables()
	const collectionModes = collections.map((collection) => collection.modes).flat()
	const collectionVariablesByMode = []

	for (const collection of collections) {
		const variables = collectionVariables.filter(
			(v) => v.variableCollectionId === collection.id
		)

		for (const mode of collection.modes) {
			const collectionName = () => {
				const modeCount = collection.modes.length

				return modeCount > 1 ? `${collection.name}/${mode.name}` : collection.name
			}

			collectionVariablesByMode.push({
				key: collection.key,
				collectionName: collectionName(),
				variables: await _getVariablesByMode(mode, collectionModes, variables),
				mode
			})
		}
	}

	collectionVariablesByMode.filter(c => props._collections.find((_c: any) => _c.key === c.key)).map((collection) => {
		const unitCollection = props._collections.find((c: any) => c.key === collection.key)

		content[collection.collectionName] = arrayToNestedObject(
			collection.variables,
			unitCollection ? unitCollection.unit : ""
		)
	})

	figma.ui.postMessage({
		type: "downloadJSON",
		data: content
	})
}
