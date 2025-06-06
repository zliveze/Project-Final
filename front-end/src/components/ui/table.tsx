import * as React from "react"

type TableProps = React.HTMLAttributes<HTMLTableElement>

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table
        ref={ref}
        className="w-full caption-bottom text-sm"
        {...props}
      />
    </div>
  )
)
Table.displayName = "Table"

type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ ...props }, ref) => (
    <thead ref={ref} className="[&_tr]:border-b" {...props} />
  )
)
TableHeader.displayName = "TableHeader"

type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ ...props }, ref) => <tbody ref={ref} className="divide-y" {...props} />
)
TableBody.displayName = "TableBody"

type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ ...props }, ref) => (
    <tfoot
      ref={ref}
      className="border-t bg-muted/50 font-medium [&>tr]:last:border-b-0"
      {...props}
    />
  )
)
TableFooter.displayName = "TableFooter"

type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ ...props }, ref) => (
    <tr
      ref={ref}
      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ ...props }, ref) => (
    <th
      ref={ref}
      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ ...props }, ref) => (
    <td
      ref={ref}
      className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
      {...props}
    />
  )
)
TableCell.displayName = "TableCell"

type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ ...props }, ref) => (
    <caption
      ref={ref}
      className="mt-4 text-sm text-muted-foreground"
      {...props}
    />
  )
)
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} 