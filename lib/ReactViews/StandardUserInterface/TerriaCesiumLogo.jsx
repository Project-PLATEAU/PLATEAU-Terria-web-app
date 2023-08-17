import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
`;

const Link = styled.a`
  display: block;
  & + & {
    margin-left: 10px;
  }
`;

const Logo = styled.img`
  height: 28px;
  width: auto;
`;

function TerriaCesiumLogo({ className }) {
  return (
    <Container className={className}>
      <Link href="https://terria.io/" target="_blank" rel="noopener noreferrer">
        <Logo
          css={`
            height: 25px;
          `} // terria ロゴの方が若干大きく見えるので調整
          src={require("../../../wwwroot/images/terria_logo.png")}
          width={102}
          height={63}
        />
      </Link>
      <Link
        href="https://cesium.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Logo
          src={require("../../../wwwroot/images/cesium_logo.png")}
          width={138}
          height={28}
        />
      </Link>
    </Container>
  );
}

TerriaCesiumLogo.propTypes = {
  className: PropTypes.string
};

export default TerriaCesiumLogo;
