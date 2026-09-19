import TableLoadingSkeleton from "@src/components/common/Loaders/TableLoadingSkeleton";

const EditUserLoadingSkeleton = () => (
  <TableLoadingSkeleton rows={5} columns={4} label="Loading user" />
);

export default EditUserLoadingSkeleton;
