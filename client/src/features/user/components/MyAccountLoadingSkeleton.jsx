import TableLoadingSkeleton from "@src/components/common/Loaders/TableLoadingSkeleton";

const MyAccountLoadingSkeleton = () => (
  <div className="my-account-skeleton" aria-busy="true">
    <TableLoadingSkeleton rows={5} columns={4} label="Loading account" />
  </div>
);

export default MyAccountLoadingSkeleton;
