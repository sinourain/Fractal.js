import flyd from 'flyd'
const R = {
  mapObjIndexed: require('ramda/src/mapObjIndexed'),
  clone: require('ramda/src/clone'),
  map: require('ramda/src/map'),
  merge: require('ramda/src/merge'),
  curryN: require('ramda/src/curryN'),
  equals: require('ramda/src/equals'),
}


let connectInterface = (md, name, model, connections) =>
  (md.interfaces[name]) ? createContext(md, connections).interfaces[name](model) : {}

let mergeModels = mds => {
  let obj = {}
  for (let key in mds) {
    obj[key] = (mds[key].root) ? mds[key].root.init({key, ...mds[key]}) : mds[key].init({key, ...mds[key]})
  }
  return obj
}

/* Merge child interfaces, flatten
  childs : Array[Object]
  interfaceName : String
  scope : String // use scope if use this function uses two or more times in an interface
*/
let mergeChilds = (childs, md, scope = '', interfaceName, connections) => {
  let objs = {}
  R.mapObjIndexed((model, idx) => {
    R.mapObjIndexed((obj, name) => {
      objs[scope + idx + '_' + name] = obj
    }, connectInterface(md, interfaceName, model, connections(+idx)))
  }, childs)
  return objs
}

let mergeChild = (model, md, scope, interfaceName, connections) => {
  let objs = {}
  R.mapObjIndexed((obj, name) => {
    objs[scope + '_' + name] = obj
  }, connectInterface(md, interfaceName, model, connections))
  return objs
}

function addModuleInfo(mDef, obj) {
  obj._moduleName = mDef.name
  obj._log = mDef.log
  obj._logAll = mDef.logAll
  return obj
}

// Composition for Fractal core, (mDefinition, connections = {}) -> ContextualizedModule
let createContext = (mDefinition, connections = {}) => {
  let mDef = R.clone(mDefinition)

  let ctx = {
    action$: flyd.stream(),
    task$: flyd.stream(),
    styles: (!!mDef.styles) ? mDef.styles : {},
  }
  // append the outputs in the context
  for (let name in mDef.outputNames) {
    ctx[mDef.outputNames[name]] = flyd.stream()
  }

  // connection with the context
  for (let name in connections) {
    if (!!ctx[name]) {
      if (name === 'action$') {
        flyd.on(d => connections[name](addModuleInfo(mDef, d)), ctx[name])
      } else {
        flyd.on(connections[name], ctx[name])
      }
    }
  }
  // contextualize inputs
  let inputs = R.map(i => R.curryN(i.length, function(...args) {
    // wrapper function for tasks
    let tasks = i(...args)
    if (tasks != undefined) {
      if (tasks instanceof Array && tasks.of == undefined && !(typeof(tasks[0]) == 'string' && tasks[1] && typeof(tasks[1].of) == 'object')) {
        // verify that is not a task in the form [String, TaskAction]
        // multiple action-task syntax
        tasks.forEach(t => {
          if (R.equals(t.of, mDef.Action)) {
            ctx.action$(t)
          } else {
            ctx.task$(t)
          }
        })
      } else if (R.equals(tasks.of, mDef.Action)) {
        // single action syntax for an action
        ctx.action$(tasks)
      } else if (tasks instanceof Array) {
        // single action syntax for a task
        ctx.task$(tasks)
      }
    } else {
      // none sense return
      // ctx.task$('undefined') // DEBUG
    }
  })(ctx, mDef.Action), mDef.inputs)
  ctx._md = mDef.load(ctx, inputs, mDef.Action) || {}
  // space for dynamic modules
  ctx._dynamicMd = []

  // connect task$
  connectTasks(ctx._md)

  function connectTasks(mds) {
    for (let name in mds) {
      if (mds[name].mDef) {
        flyd.on(task => ctx.task$(addModuleInfo(mDef, task)), mds[name].ctx.task$)
      } else {
        // connect categorized modules
        for (let subName in mds[name]) {
          flyd.on(task => ctx.task$(addModuleInfo(mDef, task)), mds[name][subName].ctx.task$)
        }
      }
    }
  }

  let md = (mds) => {
    // connect task$
    connectTasks(mds)
    ctx._md = R.merge(ctx._md, mds)
  }
  setTimeout(() => mDef.loadAfter(ctx, inputs, mDef.Action, md), 0)
  // contextualize interfaces
  mDef.interfaces = R.map(i => R.curryN(3, i)(ctx)(inputs), mDef.interfaces)

  return {
    ...mDef,
    ctx,
    inputs,
  }
}

// select a set of _md and map to a list of view interfaces
let mergeChildList = (ctx, interfaceName, rootModel, childNames, f = x => x) =>
 R.map(name => f(ctx._md[name].interfaces[interfaceName](rootModel[name])), childNames)

let mapObjToArray = (fn, obj) => {
  let arr = []
  for (let key in obj)
    arr.push(fn(obj[key], key))
  return arr
}
// TODO: implement funtion that takes [list] -> ( (key, value) -> ({key, value}) ) -> {[key]: value}
// Useful for optional styles

let setDynamicMds = (ctxArray, ctx) => {
}

export default {
  createContext,
  mergeModels,
  mergeChild,
  mergeChilds,
  mergeChildList,
  connectInterface,
  addModuleInfo,
  mapObjToArray,
  setDynamicMds,
}
