import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useLocalStorage } from "./helper";
interface SafeHydrateProps {
  children: React.JSX.Element | React.JSX.Element[];
}

const SafeHydrate = (props: SafeHydrateProps) => {
  const router = useRouter();
  const { mode } = router.query;

  const [_state, setModeState] = useLocalStorage("Util.Mode");
  // router.query は初回描画時には空のことがあるため、mode の変化を監視する
  useEffect(() => {
    if (mode && typeof mode === "string") {
      setModeState(mode);
    }
  }, [mode, setModeState]);
  return <>{props.children}</>;
};

export default SafeHydrate;
