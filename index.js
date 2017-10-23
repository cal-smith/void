// provides a generic code editor
class VoidEditor extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: "open"});
	}

	connectedCallback() {
		this.shadow.innerHTML = `
			<textarea cols="30" rows="10">${this.cleanIndent(this.innerHTML)}</textarea>
		`;
		let editable = this.shadow.querySelector("textarea");
		editable.addEventListener("keyup", () => {
			let ev = new CustomEvent("edit", {
				bubbles: true,
				detail: editable.value
			});
			this.dispatchEvent(ev);
		});
		// dispatch events to start us off
		let ev = new CustomEvent("edit", {
			bubbles: true,
			detail: editable.value
		});
		this.dispatchEvent(ev);
	}

	cleanIndent(str) {
		let strArray = str.split("\n");
		strArray = strArray.slice(strArray.findIndex(line => /\S/.test(line)));
		let indent = strArray[0].search(/\S/);
		return strArray.map(line => line.slice(indent)).join("\n");
	}
}

// consumes code from the editor and updates the view
class VoidCode extends HTMLElement {
	static get observedAttributes() { return ["scripts"]; }

	constructor() {
		super();
		this.shadow = this.attachShadow({mode: "open"});
		this.html = "";
		this.javascript = "";
		this.css = "";
		this.styles = `
			iframe {
				border: none;
			}
		`;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
			case "scripts":
				this.scripts = JSON.parse(newValue);
				break;
		}
	}

	// to allow programattic access
	get scripts() { return this._scripts; }
	set scripts(v) { this._scripts = v; }

	// run once the component is upgraded in the DOM
	connectedCallback() {
		this.shadow.innerHTML = `
			<style>${this.styles}</style>
			<div class="editors">
				<slot name="html"></slot>
				<slot name="javascript"></slot>
				<slot name="css"></slot>
			</div>
		`;
		let editors = this.shadow.querySelector(".editors");
		editors.addEventListener("edit", (ev) => {
			switch (ev.target.getAttribute("slot")) {
				case "javascript":
					this.javascript = ev.detail;
					break;
				case "html":
					this.html = ev.detail;
					break;
				case "css":
					this.css = ev.detail;
					break;
			}
			this.renderFrame();
		});
		this.renderFrame();
	}

	// update the iframe
	renderFrame() {
		let jsBlob = new Blob([this.javascript], {type: "text/javascript"});
		let jsBlobURL = URL.createObjectURL(jsBlob);
		let cssBlob = new Blob([this.css], {type: "text/css"});
		let cssBlobURL = URL.createObjectURL(cssBlob);
		let html = `
			<html>
				<head>
					<link rel="stylesheet" type="text/css" href="${cssBlobURL}">
				</head>
				<body>
					${this.html}
					<script src="${jsBlobURL}"></script>
				</body>
			</html>
		`;
		let htmlBlob = new Blob([html], {type: "text/html"});
		let htmlBlobURL = URL.createObjectURL(htmlBlob);
		if (!this.frame) {
			this.frame = document.createElement("iframe");
			this.frame.setAttribute("src", htmlBlobURL);
			this.frame.setAttribute("sandbox", "allow-scripts allow-pointer-lock allow-same-origin allow-popups allow-modals allow-forms");
			this.shadow.appendChild(this.frame);
		} else {
			this.frame.setAttribute("src", htmlBlobURL);
		}
	}

	// misc render
	render() {

	}
}

customElements.define("void-code", VoidCode);
customElements.define("void-editor", VoidEditor);