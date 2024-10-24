import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import "./App.css"

function App() {
	const [collections, setCollections] = useState<any[]>([])

	useEffect(() => {
		onmessage = (event) => {
			if (event.data.pluginMessage.type === "getVariableCollections") {
				const _collections = event.data.pluginMessage.data as any[]

				// setCollections(_collections)
			}

			if (event.data.pluginMessage.type === "downloadJSON") {
				const blob = new Blob(
					[JSON.stringify(event.data.pluginMessage.data, null, "  ")],
					{ type: "application/json" }
				)
				const url = URL.createObjectURL(blob)
				const downLoadLink = document.getElementById(
					"downLoadLink"
				) as HTMLAnchorElement

				downLoadLink.download = "tokens.json"
				downLoadLink.href = url
				downLoadLink.dataset.downloadurl = [
					"text/plain",
					downLoadLink.download,
					downLoadLink.href
				].join(":")
				downLoadLink.click()
			}
		}
	}, [])

	const onDownload = () => parent.postMessage({ pluginMessage: { type: "exportVariables", collections } }, "*")

	const onChangeUnit = (value: string, collectionId: string) => {
		const _collection = collections.find(c => c.key === collectionId)
		const otherCollections = collections.filter(c => c.key !== collectionId)

		if (_collection) {
			setCollections([
				...otherCollections,
				{
					..._collection,
					unit: value
				}
			])
		}
	}

	return (
		<main className="main">
			<div
			  className="list-header"
				style={{
					display: collections.length === 0 ? "none" : "flex"
				}}
			>
				<p>Collection Name</p>
				<p>Unit</p>
			</div>
			<ul
			  className="collections"
				style={{
					display: collections.length === 0 ? "none" : "grid"
				}}
			>
				{collections.sort((v, p) => v.name.toUpperCase() > p.name.toUpperCase() ? 1 : -1).map((collection) => (
					<li key={collection.key}>
						<p className="collectionName">{collection.name}</p>
						<div style={{ position: "relative" }}>
							<select
								name={`${collection.key}-unit`}
								onChange={event => onChangeUnit(event.target.value, collection.key)}
								style={{
									width: "64px"
								}}
							>
								<option value=""></option>
								<option value="px">px</option>
								<option value="%">%</option>
								<option value="rem">rem</option>
								<option value="em">em</option>
							</select>
							<ChevronDown
								size={14}
								style={{
									position: "absolute",
									right: "4px",
									top: "6px",
									color: "#374151"
								}}
							/>
						</div>
					</li>
				))}
			</ul>
			<p
			  style={{
					display: collections.length !== 0 ? "none" : "block",
					textAlign: "center",
					fontSize: "14px",
					color: "#374151",
					marginTop: "64px"
				}}
			>
				nothing collections
			</p>
			<div
			  style={{
					width: "100%",
					position: "fixed",
					bottom: 0,
					left: 0,
					padding: "16px",
					backgroundColor: "#fff",
					zIndex: 999
				}}
			>
				<button type="button" onClick={onDownload} style={{
					backgroundColor: collections.length !== 0 ? "rgb(16, 162, 229)" : "rgba(16, 162, 229, 0.5)",
				}}>
					Export to JSON
				</button>
			</div>
			<a
				download={true}
				href="tokens.json"
				id="downLoadLink"
				style={{ display: "none" }}
			>
				download
			</a>
		</main>
	)
}

export default App
