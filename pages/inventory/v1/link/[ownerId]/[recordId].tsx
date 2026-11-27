import { useRouter } from "next/router";
import { useLinkRedirect } from "../../../../../src/inventory/inventoryHelper";
import {
  Alert,
  Backdrop,
  CircularProgress,
  Container,
  Link,
} from "@mui/material";

const Index = () => {
  const router = useRouter();
  const { ownerId, recordId } = router.query;
  const isValidQuery =
    typeof ownerId === "string" && typeof recordId === "string";

  // hook は早期 return より前で呼ぶ (クエリが揃うまでは何も取得しない)
  const { error } = useLinkRedirect(
    isValidQuery ? ownerId : undefined,
    isValidQuery ? recordId : undefined
  );

  if ((router.isReady && !isValidQuery) || error) {
    return (
      <Container sx={{ paddingTop: 6 }}>
        <Alert severity="error">
          Failed to open this inventory link.{" "}
          <Link href="/inventory/v1/top">Back to top</Link>
        </Alert>
      </Container>
    );
  }

  return (
    <Backdrop
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={true}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default Index;
