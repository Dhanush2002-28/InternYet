import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribePaymentVerification } from "../data/store";
import { FullPageLoader } from "./FullPageLoader";

export function usePaymentVerified() {
  const { profile } = useAuth();
  const uid = profile?.role === "student" ? profile.uid : null;
  const [verified, setVerified] = useState(true);

  useEffect(() => {
    if (!uid) {
      setVerified(true);
      return undefined;
    }
    setVerified(null);
    return subscribePaymentVerification(uid, (verification) =>
      setVerified(Boolean(verification))
    );
  }, [uid]);

  return verified;
}

export default function PaymentGate({ children }) {
  const verified = usePaymentVerified();
  if (verified === null) return <FullPageLoader label="Checking your payment status…" />;
  if (!verified) return <Navigate to="/student/payment" replace />;
  return children;
}