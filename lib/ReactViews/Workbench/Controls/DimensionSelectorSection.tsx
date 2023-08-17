import i18next from "i18next";
import { observer } from "mobx-react";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled from "styled-components";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import { BaseModel } from "../../../Models/Definition/Model";
import SelectableDimensions, {
  filterSelectableDimensions,
  Placement,
  SelectableDimension,
  SelectableDimensionCheckboxGroup,
  SelectableDimensionGroup
} from "../../../Models/SelectableDimensions";
import Box from "../../../Styled/Box";
import Checkbox from "../../../Styled/Checkbox";
import Select from "../../../Styled/Select";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";

interface PropsType extends WithTranslation {
  item: SelectableDimensions & BaseModel;
  /** Placement used to filter selectableDimensions.placement (eg 'belowLegend) */
  placement: Placement;
}

@observer
class DimensionSelectorSection extends React.Component<PropsType> {
  render() {
    const item = this.props.item;

    const selectableDimensions = filterSelectableDimensions(
      this.props.placement
    )(item.selectableDimensions);

    if (selectableDimensions.length === 0) {
      return null;
    }

    return (
      <Box displayInlineBlock fullWidth>
        {selectableDimensions.map((dim, i) => (
          <DimensionSelector
            key={`${item.uniqueId}-${dim.id}-fragment`}
            item={item}
            dimension={dim}
          />
        ))}
      </Box>
    );
  }
}

export const DimensionSelector: React.FC<{
  item: BaseModel;
  dimension: SelectableDimension;
}> = observer(({ item, dimension: dim }) => {
  const setDimensionValue = (dimension: SelectableDimension, value: string) => {
    if (dimension.type !== "group") {
      dimension.setDimensionValue(CommonStrata.user, value);
    }
  };

  return (
    <DimensionSelectorContainer>
      {dim.name && dim.type !== "group" ? (
        <>
          <label htmlFor={`${item.uniqueId}-${dim.id}`}>
            <Text medium as="span">
              {dim.name}:
            </Text>
          </label>
          <Spacing bottom={1} />
        </>
      ) : null}
      {dim.type === "checkbox" && (
        /* Checkbox Selectable Dimension */
        <Checkbox
          isChecked={dim.selectedId === "true"}
          onChange={evt =>
            setDimensionValue(dim, evt.target.checked ? "true" : "false")
          }
        >
          <Text>
            {dim.options?.find(opt => opt.id === dim.selectedId)?.name ??
              (dim.selectedId === "true" ? "Enabled" : "Disabled")}
          </Text>
        </Checkbox>
      )}
      {(dim.type === undefined || dim.type === "select") && (
        /* Select (dropdown) Selectable Dimension (default) */
        <Select
          light
          name={dim.id}
          id={`${item.uniqueId}-${dim.id}`}
          value={
            typeof dim.selectedId === "undefined"
              ? "__undefined__"
              : dim.selectedId
          }
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) =>
            setDimensionValue(dim, evt.target.value)
          }
        >
          {/* If no value as been selected -> add option */}
          {(typeof dim.selectedId === "undefined" || dim.allowUndefined) && (
            <option key="__undefined__" value="">
              {dim.undefinedLabel ??
                i18next.t("workbench.dimensionsSelector.undefinedLabel")}
            </option>
          )}
          {dim.options!.map(option => (
            <option key={option.id} value={option.id}>
              {option.name || option.id}
            </option>
          ))}
        </Select>
      )}
      {dim.type === "checkbox-group" && (
        <DimensionSelectorCheckboxGroup item={item} dimension={dim} />
      )}
      {dim.type === "group" && (
        <DimensionSelectorGroup item={item} dimension={dim} />
      )}
    </DimensionSelectorContainer>
  );
});

/**
 * Component to render a SelectableDimensionGroup.
 */
export const DimensionSelectorCheckboxGroup: React.FC<{
  item: BaseModel;
  dimension: SelectableDimensionCheckboxGroup;
}> = ({ item, dimension: dim }) => {
  return (
    <CheckboxDetails open={dim.selectedId === "true"}>
      <summary>
        <Checkbox
          isChecked={dim.selectedId === "true"}
          onChange={evt =>
            dim.setDimensionValue(
              CommonStrata.user,
              evt.target.checked ? "true" : "false"
            )
          }
          css={`
            /* Stretch the checkbox to full-width so that clicking anywhere fires a checkbox event */
            flex-grow: 1;
          `}
        >
          <Text>
            {dim.options?.find(opt => opt.id === dim.selectedId)?.name ??
              (dim.selectedId === "true" ? "Enabled" : "Disabled")}
          </Text>
        </Checkbox>
      </summary>
      <div>
        {/* recursively render nested dimensions */}
        {filterSelectableDimensions(dim.placement || "default")(
          dim.selectableDimensions
        ).map(nestedDim => (
          <DimensionSelector
            item={item}
            dimension={nestedDim}
            key={`${item.uniqueId}-${dim.id}-${nestedDim.id}`}
          />
        ))}
      </div>
    </CheckboxDetails>
  );
};

/**
 * Component to render a SelectableDimensionGroup.
 */
export const DimensionSelectorGroup: React.FC<{
  item: BaseModel;
  dimension: SelectableDimensionGroup;
}> = ({ item, dimension: dim }) => {
  return (
    <details>
      <summary>
        <Text textLight medium as="span">
          {dim.name}
        </Text>
      </summary>
      <div>
        {/* recursively render nested dimensions */}
        {filterSelectableDimensions(dim.placement || "default")(
          dim.selectableDimensions
        ).map(nestedDim => (
          <DimensionSelector
            item={item}
            dimension={nestedDim}
            key={`${item.uniqueId}-${dim.id}-${nestedDim.id}`}
          />
        ))}
      </div>
    </details>
  );
};

/**
 * Container component
 */
const DimensionSelectorContainer = styled.div`
  margin-top: 10px;

  summary {
    cursor: pointer;
  }
  > details > div {
    padding-left: 20px;
  }
`;

const CheckboxDetails = styled.details`
  summary {
    display: flex;
    list-style: none;
  }
`;

export default withTranslation()(DimensionSelectorSection);
