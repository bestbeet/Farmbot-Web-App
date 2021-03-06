import { ResourceIndex } from "../../../resources/interfaces";
import {
  selectAllPoints,
  selectAllTools,
  mapToolIdToName
} from "../../../resources/selectors";
import { CowardlyDictionary } from "../../../util";
import { PointerTypeName } from "../../../interfaces";
import { PointerType, TaggedTool } from "../../../resources/tagged_resources";
import { DropDownItem } from "../../../ui/index";
import { Vector3 } from "farmbot/dist";
import { TOOL } from "./interfaces";
import * as _ from "lodash";

export function generateList(input: ResourceIndex): DropDownItem[] {
  const toolNameById = mapToolIdToName(input);
  const SORT_KEY: keyof DropDownItem = "headingId";
  const points = selectAllPoints(input)
    .filter(x => (x.body.pointer_type !== "ToolSlot"));
  const toolDDI: DropDownItem[] = selectAllTools(input)
    .filter((x: TaggedTool) => !!x.body.id)
    .map(t => formatTools(t));
  return _(points)
    .map(formatPoint(toolNameById))
    .sortBy(SORT_KEY)
    .reverse()
    .concat(toolDDI)
    .filter(x => parseInt("" + x.value) > 0)
    .value();
}

export const NAME_MAP: Record<PointerTypeName, string> = {
  "GenericPointer": "Map Point",
  "Plant": "Plant",
  "ToolSlot": "Tool Slot",
};

const formatPoint = (toolNames: CowardlyDictionary<string>) =>
  (p: PointerType): DropDownItem => {
    const { id, pointer_type, x, y, z } = p.body;
    let { name } = p.body;

    // Special formatting rules for tool slots
    if (p.body.pointer_type === "ToolSlot") {
      const tool = (p.body.tool_id && toolNames[p.body.tool_id]) || undefined;
      name = tool ? `using '${tool}'` : "no tool";
    }

    return {
      label: dropDownName(NAME_MAP[pointer_type], name, { x, y, z }),
      value: "" + id,
      headingId: pointer_type
    };
  };

const formatTools = (t: TaggedTool) => {
  const { id, name } = t.body;

  return {
    label: dropDownName("Tool", (name || "untitled")),
    value: "" + id,
    headingId: TOOL
  };
};

/** Uniformly generate a label for things that have an X/Y/Z value. */
export function dropDownName(kind: string, name: string, v?: Vector3) {
  const formattedKind = _.get(NAME_MAP, kind, kind);
  let label = `${formattedKind}: ${name || "untitled"}`;
  if (v) { label += ` (${v.x}, ${v.y}, ${v.z}) `; }
  return label;
}
