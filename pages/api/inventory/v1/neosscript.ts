import _ from "lodash";
import { createGetHandler } from "../../../../src/server/apiHandler";
import { TTL, cachedGet } from "../../../../src/server/cache";

const SLOT_MEMBER_NAMES = [
  "Name",
  "Tag",
  "Active",
  "Position",
  "Rotation",
  "Scale",
  "OrderOffset",
];

// コンポーネントの Data から ID / UpdateOrder 以外のメンバーを取り出す
function getComponentMembers(
  Data: Record<string, any>
): { key: string; data: any }[] {
  return _(Data)
    .map((data, key) => ({ key, data }))
    .reject(({ key }) => _.includes(["ID", "UpdateOrder"], key))
    .value();
}

function isArray(value) {
  return _.isArray(value);
}

function isMap(value) {
  return _.isPlainObject(value);
}

function isValidUUID(str) {
  const uuidRegexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
  return typeof str == "string" && uuidRegexExp.test(str);
}

function isLinkedId(id, refCountMap) {
  return _.size(_.get(refCountMap, id, [])) > 1;
}

function resolveId(id, refCountMap) {
  const useRelay = isLinkedId(id, refCountMap);
  return useRelay ? `relay.setRefId('${id}')` : `generateId('${id}')`;
}

function resolveData(value, refCountMap) {
  if (isArray(value)) {
    return `[${_(value)
      .map((v) => resolveData(v, refCountMap))
      .join(",")}]`;
  } else if (isMap(value)) {
    return `{${_(value)
      .map<any>((data, key) => {
        if (key == "ID") {
          return `"${key}":${resolveId(data, refCountMap)}`;
        } else {
          return `"${key}":${resolveData(data, refCountMap)}`;
        }
      })
      .join(",")}}`;
  } else {
    return isLinkedId(value, refCountMap)
      ? `relay.getRefId('${value}')`
      : JSON.stringify(value);
  }
}

function resolveMember(
  name,
  id,
  value,
  refCountMap,
  interfaceVariableName = null
) {
  const valueUnit =
    interfaceVariableName && (name === "Value" || name === "Reference")
      ? `\`\${${interfaceVariableName}}\``
      : resolveData(value, refCountMap);
  if (isLinkedId(id, refCountMap)) {
    const idUnit = resolveId(id, refCountMap);

    return `<Member name='${name}' content={{id: ${idUnit},value: ${valueUnit}}} />`;
  } else {
    return `<Member name='${name}' content={${valueUnit}} />`;
  }
}

function resolveComponent(
  component,
  refCountMap,
  addProp,
  isInterfaceSlot = false
) {
  const { Type, Data } = component;
  const { ID, "persistent-ID": PersistentId, UpdateOrder } = Data;
  const isInterfaceComponent =
    (_.startsWith(Type, "FrooxEngine.DynamicValueVariable`1[") ||
      _.startsWith(Type, "FrooxEngine.DynamicReferenceVariable`1[")) &&
    isInterfaceSlot;
  const interfaceVariableName = isInterfaceComponent
    ? _.get(Data, ["VariableName", "Data"])
    : null;
  if (interfaceVariableName) {
    addProp(interfaceVariableName);
  }

  const props = getComponentMembers(Data);
  return `<component name="${Type}" id={${resolveId(
    ID,
    refCountMap
  )}} persistentId={${resolveId(
    PersistentId,
    refCountMap
  )}} updateOrderId={${resolveId(UpdateOrder.ID, refCountMap)}} updateOrder="${
    UpdateOrder.Data
  }">
    ${_(props)
      .map(({ key, data }) => {
        const { ID, Data } = data ?? {};
        if (ID) {
          return resolveMember(
            key,
            ID,
            Data,
            refCountMap,
            interfaceVariableName
          );
        }
      })
      .join("")}
  </component>`;
}

function resolveSlot(
  slot,
  refCountMap,
  assets = [],
  typeVersions = [],
  addProp,
  deps = 0
) {
  const {
    ID,
    "Persistent-ID": PersistentId,
    Name,
    Components: { Data: Components },
    Children,
  } = slot;

  const isInterface = Name.Data === "NeosScriptInterface" && deps === 1;

  const isParentAnchor = _.startsWith(Name.Data, "NeosScriptParentAnchor:");
  const parentAnchorName = _.replace(Name.Data, "NeosScriptParentAnchor:", "");
  if (isParentAnchor) {
    addProp(parentAnchorName);
  }

  return `<slot>
  <slotData id={${resolveId(ID, refCountMap)}} persistentId={${resolveId(
    PersistentId,
    refCountMap
  )}}>
  ${_(SLOT_MEMBER_NAMES)
    .map((name) =>
      resolveMember(name, slot[name].ID, slot[name].Data, refCountMap)
    )
    .join("\n  ")}
  </slotData>
  <components>
  ${_(Components)
    .map((c) => resolveComponent(c, refCountMap, addProp, isInterface))
    .join("")}
  </components>
  <children>
  ${_(Children)
    .map((s) => resolveSlot(s, refCountMap, [], [], addProp, deps + 1))
    .join("")}
  ${isParentAnchor ? `{${parentAnchorName}}` : ""}
  </children>
  <assets>
  ${_(assets)
    .map((a) => resolveComponent(a, refCountMap, addProp))
    .join("")}
  </assets>
  <typeVersions>${_(typeVersions)
    .map(
      (version, name) => `<TypeVersion name={"${name}"} version={${version}}/>`
    )
    .join("")}</typeVersions>
  </slot>`;
}

function createMemberRefList(member) {
  if (isArray(member)) {
    return _(member).map(createMemberRefList).flatMap().value();
  } else if (isMap(member)) {
    return _(member)
      .map<any>((data, key) => {
        if (key == "ID") {
          return [data];
        } else {
          return createMemberRefList(data);
        }
      })
      .flatMap()
      .value();
  } else if (isValidUUID(member)) {
    return [member];
  } else {
    return [];
  }
}

function createComponentRefList({ Data }) {
  const { ID, "persistent-ID": PersistentId, UpdateOrder } = Data;
  return [
    ID,
    PersistentId,
    UpdateOrder.ID,
    ..._(getComponentMembers(Data)).map(createMemberRefList).flatMap().value(),
  ];
}
function createSlotRefList(slot) {
  const {
    ID,
    "Persistent-ID": PersistentId,
    Components: { Data: Components },
    Children,
  } = slot;
  return [
    ID,
    PersistentId,
    ..._.map(SLOT_MEMBER_NAMES, (name) => slot[name].ID),
    ..._(Components ?? [])
      .map(createComponentRefList)
      .flatMap()
      .value(),
    ..._(Children ?? [])
      .map(createSlotRefList)
      .flatMap()
      .value(),
  ];
}

export default createGetHandler(async (req, res) => {
  const data = await cachedGet(
    `https://decompress.kokoa.dev/?id=${req.query.id}`,
    TTL.asset
  );
  const rootSlot = _.get(data, "Object", {});
  const assets = _.get(data, "Assets", []);
  const typeVersions = _.get(data, "TypeVersions", []);
  const propList = [];
  const addProp = (prop) => {
    propList.push(prop);
  };
  const refCountMap = _([
    ...createSlotRefList(rootSlot),
    ..._(assets).map(createComponentRefList).flatMap().value(),
  ])
    .groupBy()
    .value();
  const mainString = resolveSlot(
    rootSlot,
    refCountMap,
    assets,
    typeVersions,
    addProp
  );
  const propDefine = _.join(propList, ",");
  res.send(
    `import React from "react";
          import { RelayManager } from "lib/neosScript/util/RelayManager";
          import { generateId } from "lib/neosScript/util";
          import { Member, TypeVersion } from "lib/neosScript/core/Member";
          export default ({${propDefine}})=>{const relay = new RelayManager(); return (${mainString});}`
  );
});
