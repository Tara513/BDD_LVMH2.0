import type { ReactNode } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export const ChartCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <Card>
    <CardHeader title={title} description={description} />
    <CardBody>{children}</CardBody>
  </Card>
);

