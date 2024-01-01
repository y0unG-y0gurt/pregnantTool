const ShadowMode = "closed";

function template(text, data) {
    var t = text
        .replace(/[\r\t\n]/g, " ")
        .split("<%").join("\t")
        .replace(/((^|%>)[^\t]*)'/g, "$1\r")
        .replace(/\t=(.*?)%>/g, "'+$1+'")
        .split("\t").join("';")
        .split("%>").join("s+='")
        .split("\r").join("\\'") + "';}return s";
    var f = new Function("obj", "var s='';with(obj){s+='" + t);
    return f(data ? data : {});
}

class TabsElement extends HTMLElement {

    constructor() {
        super();

        this._shadowRoot = this.attachShadow({ mode: ShadowMode });
        this._shadowRoot.appendChild(TabsElement.getTemplate());

        this._h = this._shadowRoot.host.children[0];
        this._c = this._shadowRoot.host.children[1];

        this._h.onclick = this._onTabClick.bind(this);

        this._oldIndex = -1;

        if (this._c) {
            for (var i = 0; i < this._c.children.length; i++) {
                var child = this._c.children[i];
                child.setAttribute("hidden", true);
            }
        }

        this.attributeChangedCallback("index", this._oldIndex, this.index || 0);
    }

    static get observedAttributes() {
        return ['index'];
    }

    get index() {
        return parseInt(this.getAttribute('index') || 0);
    }
    set index(value) {
        this.setAttribute('index', value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }

        this._oldIndex = oldValue;

        switch (name) {
            case "index":
                this._setIndex(oldValue || 0, newValue);
                break;
        }
    }

    _onTabClick(e) {
        if (!e.target.classList.contains('tab')) {
            return;
        }

        var oldIndex = this.index;
        var newIndex = this._getIndex(e.target);
        if (newIndex == oldIndex) {
            return
        }

        this.index = newIndex;

        var detail = { oldIndex, newIndex };
        this.onChange(new CustomEvent('tabchange', { detail }));
    }

    _getIndex(child) {
        var index = -1;
        var children = this._h.children;
        for (var i = 0; i < children.length; i++) {
            if (children[i] == child) {
                index = i;
                break;
            }
        }
        return index;
    }

    _setIndex(oldValue, newValue) {
        if (oldValue > -1) {
            this._h.children[oldValue].classList.remove("active");
            if (this._c) {
                this._c.children[oldValue].setAttribute("hidden", true);
            }
        }
        if (newValue >= 0) {
            this._h.children[newValue].classList.add("active");
            if (this._c) {
                this._c.children[newValue].removeAttribute("hidden");
            }
        }
    }

    onChange(e) {
        this.dispatchEvent(e);
    }
}
TabsElement.getTemplate = function () {
    const template = document.createElement('template');
    template.innerHTML = `<slot name="h"></slot><slot name="c"></slot>`;
    return template.content.cloneNode(true);
}

const html_tree = `<ul class="tree"></ul>`;
const html_tree_node = `
<%for(var i = 0; i < children.length; i++){var node=children[i];%>
<%if(node.children){%>
<li class="tree-pack<%if(node.expanded==1){%> tree-expanded<%}%>" data-id="<%=node.id%>">
<div class="tree-bold">
    <span class="tree-null<%=level%>"></span>
    <span class="tree-arrow"></span>
    <span><%=node.label%></span>
</div>
<ul><%=build(node.children,level)%></ul>
</li>
<%}else{%>
<li class="tree-node" data-id="<%=node.id%>">
<span class="tree-null<%if(node.icon){%><%=(level-1)%><%}else{%><%=level%><%}%>"></span><%=node.label%>
</li>
<%}%>
<%}%>`;

class TreeElement extends HTMLElement {

    constructor() {
        super();

        this.onclick = this.onTreeClick.bind(this);
        this._layout = html_tree_node;
        this._lastSelectedItem = null;
        this._searchInput = "";
    }

    static get observedAttributes() {
        return ['layout', 'nodes'];
    }

    get nodes() {
        return this.getAttribute('nodes');
    }
    set nodes(value) {
        this.setAttribute('nodes', value);
    }

    get layout() {
        return this.getAttribute('layout') || this._defaultLayout;
    }
    set layout(value) {
        this.setAttribute('layout', value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }

        switch (name) {
            case "nodes":
                this.load(newValue);
                break;
        }
    }

    setLayout(value) {
        this._layout = value;
    }

    load(nodes, status = []) {
        this.setStatus(nodes, status);
        this.buildTree(nodes);
    }

    setStatus(nodes, status, path = "", progress = 0) {
        if (Array.isArray(status) && status.length == 0) {
            return;
        }

        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (!node.children) {
                continue;
            }
            let next = path + node.id;
            if (Array.isArray(status)) {
                if (status.indexOf(next) >= 0) {
                    node.expanded = 1;
                    progress++;
                }
                if (progress >= status.length) {
                    break;
                }
            } else if (status) {
                node.expanded = 1;
            }
            this.setStatus(node.children, status, next + "/", progress);
        }
    }

    buildTree(nodes) {
        this.innerHTML = this.buildNode(nodes, -1);
    }

    buildNode(nodes, level, color) {
        level += 1;
        return template(this._layout, {
            level: level,
            children: nodes,
            color: color,
            build: (nodes, level, color) => {
                return this.buildNode(nodes, level, color);
            }
        });
    }

    addNodes(nodes) {
    }

    removeNodes() {
    }

    onTreeClick(e) {
        e.stopPropagation();
        e.preventDefault();

        var target = e.target;
        if (target == e.currentTarget) {
            return;
        }

        var sender = (target.classList.contains("tree-node") || target.classList.contains("tree-bold")) ? target : target.parentElement
        var isBold = sender.classList.contains("tree-bold");

        var detail = {
            id: sender.dataset.id,
            type: isBold ? "bold" : "node",
            text: sender.innerText,
            path: TreeElement.getNodePath(sender)
        }

        var event = null;

        if (isBold) {
            sender.parentElement.classList.toggle("tree-expanded");
            detail.bold = sender.parentElement.classList.contains("tree-expanded");
            event = new CustomEvent('boldClick', {
                detail
            });
        } else {
            this.selectedItem(sender);
            event = new CustomEvent('nodeClick', {
                detail
            });
        }

        this.onClick(event, e);
    }

    selectedItem(sender) {
        if (this._lastSelectedItem != null) {
            this._lastSelectedItem.classList.remove("tree-selected");
        }
        sender.classList.add("tree-selected");
        this._lastSelectedItem = sender;
    }

    collapseAll() {
        var nodes = this.element.children;
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].classList.remove("tree-expanded");
        }
    }

    expandAll() {
        var nodes = this.element.children;
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].classList.add("tree-expanded");
        }
    }

    expandNode(id) {
        var node = this._findPack(id);
        if (node) {
            node.classList.add("tree-expanded");
        }
    }

    collapseNode(id) {
        var node = this._findPack(id);
        if (node) {
            node.classList.remove("tree-expanded");
        }
    }

    search(value) {
        if (value.length == 0) {
            this.classList.remove("tree-searched");
            this._clearFilter();
            return;
        }

        if (this._searchInput != value) {
            this.classList.add("tree-searched");
        }
        this._searchInput = value;

        var exp = new RegExp(value, 'gi');
        this._filter(this.children, exp);
    }

    dfs(value) {
    }

    bfs(value) {
    }

    _filter(nodes, exp) {
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.classList.contains("tree-node")) {
                var item = node.innerText.match(exp);
                if (item && item.length > 0) {
                    node.classList.remove('tree-filtered');
                } else {
                    node.classList.add('tree-filtered');
                }
            } else if (node.children && node.children.length > 0) {
                this._filter(node.children, exp);
            }
        }
    }

    _clearFilter() {
        this._searchInput = "";
        var filterNodes = this.querySelectorAll(".tree-filtered");
        for (let i = 0; i < filterNodes.length; i++) {
            let element = filterNodes[i];
            element.classList.remove("tree-filtered");
        }
    }

    _findPack(id, type) {
        var data_type = type || "id";
        var tree_item = this.querySelector(".tree-pack[data-" + data_type + "='" + id + "']");
        return tree_item;
    }

    onClick(event, e) {
        this.dispatchEvent(event, e);
    }
}
TreeElement.getNodePath = function (target) {
    var np = [];
    var md = 16;

    var sender = target;
    if (sender.classList.contains("tree")) {
        return np;
    }

    while (!sender.classList.contains("tree") && md > 0) {
        md--;
        var id = sender.dataset.id;
        if (id) {
            np.push(id);
        }
        sender = sender.parentElement;
    }
    np.reverse();

    return np.join('/');
}

const elementx = 'x';
const elements = {
    tabs: TabsElement,
    tree: TreeElement
};

const defineComponent = function (name, element) {
    window.customElements.define(elementx + '-' + name, element);
}

const register = function () {
    for (const key in elements) {
        defineComponent(key, elements[key]);
    }
}

register();

const html_fields = `
<%for(let i = 0; i < allFields.length; i++){let item=allFields[i];%>
<label class="field-item p-l-r">
    <input class="field-item-icon m-r-d" type="checkbox" value="<%=item%>"<%if(fields.indexOf(item) > -1){%> checked<%}%> /><%=item%>
</label>
<%}%>`;

const locales = {
    "en": {
        "projectType1": "Front page",
        "projectType2": "uniCloud admin page",
        "collection": "Collection",
        "checkAll": "Check all",
        "exportFileList": "Export file list",
        "vuePage": "vue page",
        "nvuePage": "nvue page",
        "projectMode": "Project mode",
        "uniModulesMode": "uniModules mode",
        "pluginID": "Plugin ID",
        "filePreview": "File preview"
    },
    "cn": {
        "projectType1": "前端页面",
        "projectType2": "uniCloud admin 页面",
        "collection": "表名",
        "checkAll": "全选所有字段",
        "exportFileList": "导出文件清单",
        "vuePage": "vue页面",
        "nvuePage": "nvue页面",
        "projectMode": "项目模式",
        "uniModulesMode": "uniModules模式",
        "pluginID": "插件ID",
        "filePreview": "文件预览"
    }
};

const CodeType = {
    UniApp: "uni-app",
    UniAppModules: "uni-app.uni_modules",
    UniAdmin: "uni-admin",
    UniAdminModules: "uni-admin.uni_modules"
};

const PageType = {
    All: "all",
    UniApp: "uni-app",
    UniAdmin: "uni-admin"
};

const AuthorSupportChar = "abcdefghijklmnopqrstuvwxyz0123456789-";

const NoDataDisplay = "仅自动生成的文件会在此处显示代码。三方库不在此处显示（可在导入确认界面查看）。";

class BaseTabView {

    constructor(element, type) {
        this.element = element;
        this._type = type;

        this._collection_view = this.element.querySelector(".collecton");

        this._fieldView = this.element.querySelector(".fields");
        this._fieldView.addEventListener("change", this._onFieldChange.bind(this));
        this._selectAllFieldCheckbox = this.element.querySelector(".select-all-field");
        this._selectAllFieldCheckbox.addEventListener("change", this._onSelectAllFieldChange.bind(this));

        this._treeView1 = this.element.querySelector(".tree-project");
        this._treeView1.addEventListener("nodeClick", this.onTreeNodeClick1.bind(this));
        this._treeView2 = this.element.querySelector(".tree-uni-modules");
        this._treeView2.addEventListener("nodeClick", this.onTreeNodeClick2.bind(this));

        this._modeRadios = this.element.querySelector(".mode-radios");
        this._modeRadios.addEventListener("change", this.onModeChange.bind(this));

        this._fileView = this.element.querySelector(".project-file");

        this._authorView = this.element.querySelector(".author");
        this._authorId = this.element.querySelector(".authorid");
        this._authorId.addEventListener("input", this.onauthorchange.bind(this));
        this._authorIdError = this.element.querySelector(".authorid-error");

        this._mode = 0;
        this._uniFileTree0 = {};
        this._uniFileTree1 = {};
        this._treeView1Status = ["pages", "pages/pages_children"];
        this._treeView2Status = ["uni_modules", "uni_modules/uni_modules_name", "uni_modules/uni_modules_name/pages", "uni_modules/uni_modules_name/pages/pages_children"];

        this._collection = "";
        this._allFields = [];
        this._fields = [];
        this._files = {};
        this._projectType = "vue";

        this._fileTree = [];
        this._fileTreeMapping = {};
        this._fileTreeForUniModules = [];
        this._fileTreeForUniModulesMapping = {};
    }

    get type() {
        return this._type;
    }

    get projectType() {
        return this._projectType;
    }

    get mode() {
        return this._mode;
    }

    get pluginId() {
        return this._authorId.value;
    }

    onTreeNodeClick1(e) {
        var id = e.detail.id;
        if (id === 'undefined') {
            this.updateFile(NoDataDisplay);
            return;
        }

        var text = this._fileTreeMapping[id];
        this.updateFile(text);
    }

    onTreeNodeClick2(e) {
        var id = e.detail.id;
        if (id === 'undefined') {
            this.updateFile(NoDataDisplay);
            return;
        }

        var text = this._fileTreeForUniModulesMapping[id];
        this.updateFile(text);
    }

    _onSelectAllFieldChange(e) {
        let checked = e.target.checked;
        this._fields.length = 0;
        if (checked) {
            this._fields.push(...this._allFields);
        }
        this.updateField(true);
    }

    _onFieldChange(e) {
        var checked = e.target.checked;
        var checked_value = e.target.value;
        if (checked) {
            this._fields.push(checked_value);
        } else {
            var index = this._fields.indexOf(checked_value);
            this._fields.splice(index, 1);
        }

        this.updateField(true);
    }

    onModeChange(e) {
        this._mode = parseInt(e.target.dataset.id);
        if (this._mode === 0) {
            this._treeView1.removeAttribute("hidden");
            this._treeView2.setAttribute("hidden", '');
            this._authorView.setAttribute("hidden", '');
        } else if (this._mode === 1) {
            this._treeView1.setAttribute("hidden", '');
            this._treeView2.removeAttribute("hidden");
            this._authorView.removeAttribute("hidden");
        }
    }

    updateData(data) {
        this._collection = data.collection;
        this._allFields = data.fields;
        this._fields = data.checkedFields;
        this.updateFile('');
    }

    updateCollection() {
        this._collection_view.innerHTML = this._collection;
    }

    updateField(change) {
        this._fieldView.innerHTML = template(html_fields, {
            fields: this._fields,
            allFields: this._allFields
        });
        this._selectAllFieldCheckbox.checked = this._allFields.length === this._fields.length;

        if (change) {
            this.onFieldChange(this, { fields: this._fields });
        }
    }

    updateTree() {
        this._treeView1.load(this._fileTree, this._treeView1Status);
        this._treeView2.load(this._fileTreeForUniModules, this._treeView2Status);

        this._fileTreeMapping = {};
        this._extractTree(this._fileTree, this._fileTreeMapping);

        this._fileTreeForUniModulesMapping = {}
        this._extractTree(this._fileTreeForUniModules, this._fileTreeForUniModulesMapping);

        if (this._authorId.value.length) {
            this._fileTreeForUniModules[0].children[0].label = this._authorId.value;
        } else {
            this._authorId.value = this._fileTreeForUniModules[0].children[0].label;
        }
    }

    updateFile(text) {
        this._fileView.innerText = text;
        hljs.highlightBlock(this._fileView);
    }

    onauthorchange(e) {
        let value = e.target.value;
        let isValidate = true;
        for (let index = 0; index < value.length; index++) {
            const element = value[index].toLowerCase();
            if (!AuthorSupportChar.includes(element)) {
                isValidate = false;
                break;
            }
        }
        if (!isValidate) {
            this._authorIdError.innerText = "插件ID不合法，只能包含字母、数字、-";
            return;
        }
        this._authorIdError.innerText = "";

        let authorIdElement = this.element.querySelector("[data-id='uni_modules_id']").children[0].lastElementChild;
        authorIdElement.innerText = value;

        //let packageJson = JSON.parse(this._files.uniModulesPackageJson);
        //packageJson.id = value;
        //this._files.uniModulesPackageJson = JSON.stringify(packageJson, null, 4);
    }

    _extractTree(nodes, mapping) {
        for (let i = 0; i < nodes.length; i++) {
            let { id, content, children } = nodes[i];

            if (id) {
                mapping[id] = content;
            }

            if (children) {
                this._extractTree(children, mapping);
            }
        }
    }

    onFieldChange(e) {
    }
}

class UniAppView extends BaseTabView {

    constructor(element) {
        super(element, PageType.UniApp);

        this._projectTypeView = this.element.querySelector(".project-type");
        this._projectTypeView.addEventListener("change", this.onProjectTypeChange.bind(this));
    }

    onProjectTypeChange(e) {
        this._projectType = e.target.dataset.id;
        this.onFieldChange(this, { fields: this._fields });
    }

    update(data) {
        super.updateData(data);

        this._fileTree = data.project;
        this._fileTreeForUniModules = data.projectForUniModules;

        this.updateCollection();
        this.updateField();
        this.updateTree();
    }
}

class UniAdminView extends BaseTabView {

    constructor(element) {
        super(element, PageType.UniAdmin);
    }

    update(data) {
        super.updateData(data);

        this._fileTree = data.adminProject;
        this._fileTreeForUniModules = data.adminProjectForUniModules;

        this.updateCollection();
        this.updateField();
        this.updateTree();
    }
}

class MainFrame {

    constructor() {
        var root = document.createElement("div");
        root.innerHTML = template(document.querySelector("#main").innerHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>'), { locale: locales.cn });
        document.body.appendChild(root.children[0])
        this._tab = document.querySelector(".tab");
        this._projectView = new UniAppView(document.querySelector(".tab-project"));
        this._projectAdminView = new UniAdminView(document.querySelector(".tab-project-admin"));

        this._projectView.onFieldChange = this.onFieldChange.bind(this);
        this._projectAdminView.onFieldChange = this.onFieldChange.bind(this);

        //this._tab.addEventListener('tabchange', this.onTabChange.bind(this));
    }

    get selectType() {
        return [PageType.UniApp, PageType.Admin][this._tab.index];
    }

    get exportType() {
        let pageIndex = this._tab.index;
        let mode = pageIndex === 0 ? this._projectView.mode : this._projectAdminView.mode;
        return [[CodeType.UniApp, CodeType.UniAppModules], [CodeType.UniAdmin, CodeType.UniAdminModules]][pageIndex][mode];
    }

    get pluginId() {
        if (this._tab.index === 0) {
            return this._projectView.pluginId;
        }
        return this._projectAdminView.pluginId;
    }

    execute(cmd, data) {
        switch (cmd) {
            case PageType.All:
                this.onBuild(data);
                break;
            case PageType.UniApp:
                this._projectView.update(data);
                break;
            case PageType.UniAdmin:
                this._projectAdminView.update(data);
                break;
        }
    }

    onBuild(data) {
        this._projectView.update(data);
        this._projectAdminView.update(data);
    }

    onFieldChange(sender, e) {
        hbuilderx.postMessage({
            command: 'build',
            projectType: sender.projectType,
            buildType: sender.type,
            fields: e.fields
        });
    }
}

function initReceive() {
    const mainFrame = new MainFrame();

    hbuilderx.onDidReceiveMessage((msg) => {
        if (msg.type == 'DialogButtonEvent') {
            let button = msg.button;
            if (button == '确定') {
                hbuilderx.postMessage({
                    command: 'submit',
                    exportType: mainFrame.exportType,
                    pluginId: mainFrame.pluginId ? mainFrame.pluginId : null
                });
            } else if (button == '取消') {
                hbuilderx.postMessage({
                    command: 'cancel'
                });
            }
        }

        if (msg.command) {
            mainFrame.execute(msg.command, msg.data);
        }
    });

    setTimeout(() => {
        hbuilderx.postMessage({
            command: 'ready'
        });
    }, 1);
}

window.addEventListener("hbuilderxReady", initReceive);
