import React from "react";
import { BaseModel } from "../../../Models/Definition/Model";
import ViewState from "../../../ReactViewModels/ViewState";
import { observer } from "mobx-react";
import styled from "styled-components";
import { TextSpan } from "../../../Styled/Text";

interface OpendataSectionProps {
  item: BaseModel;
}

const hasOpendata = (
  item: any
): item is { customProperties: { opendata: string } } => {
  return typeof item?.customProperties?.opendata === "string";
};

const OpendataSection: React.VFC<OpendataSectionProps> = observer(
  ({ item }) => {
    if (!hasOpendata(item)) return null;
    return (
      <Container>
        <Button
          href={item.customProperties.opendata}
          rel="noopener noreferrer"
          target="_blank"
        >
          <TextSpan textLight>オープンデータを入手</TextSpan>
        </Button>
      </Container>
    );
  }
);

const Container = styled.div`
  padding-top: 8px;
`;

const Button = styled.a`
  background: ${props => props.theme.colorPrimary};
  text-decoration: none;
  display: block;
  padding: 8px 16px;
  text-align: center;
  border-radius: 3px;
`;

export default OpendataSection;
