import React from "react";
import styled from "styled-components";

export type ToastProps = {
  children: React.ReactNode;
};

/**
 * A toast component that positions its children bottom center of the map
 */
const Toast: React.FC<ToastProps> = ({ children }) => {
  return <Container>{children}</Container>;
};

const Container = styled.div`
  position: fixed;
  bottom: 80px; //on mobile make it appear above play story button
  left: 35%;
  @media (min-width: ${props => props.theme.sm}px) {
    position: absolute;
    left: 45%; // on larger screens
    bottom: 40px;
  }

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0 7px;

  border-radius: 16px;
  min-height: 32px;
  background: ${p => p.theme.textLight};
`;

export default Toast;
