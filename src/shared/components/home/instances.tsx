import { setIsoData } from "@utils/app";
import { RouteDataResponse } from "@utils/types";
import { Component } from "inferno";
import {
  GetFederatedInstancesResponse,
  GetSiteResponse,
  Instance,
} from "lemmy-js-client";
import { relTags } from "../../config";
import { InitialFetchRequest } from "../../interfaces";
import { FirstLoadService, I18NextService } from "../../services";
import { HttpService, RequestState } from "../../services/HttpService";
import { HtmlTags } from "../common/html-tags";
import { Spinner } from "../common/icon";

type InstancesData = RouteDataResponse<{
  federatedInstancesResponse: GetFederatedInstancesResponse;
}>;

interface InstancesState {
  instancesRes: RequestState<GetFederatedInstancesResponse>;
  siteRes: GetSiteResponse;
  isIsomorphic: boolean;
}

export class Instances extends Component<any, InstancesState> {
  private isoData = setIsoData<InstancesData>(this.context);
  state: InstancesState = {
    instancesRes: { state: "empty" },
    siteRes: this.isoData.site_res,
    isIsomorphic: false,
  };

  constructor(props: any, context: any) {
    super(props, context);

    // Only fetch the data if coming from another route
    if (FirstLoadService.isFirstLoad) {
      this.state = {
        ...this.state,
        instancesRes: this.isoData.routeData.federatedInstancesResponse,
        isIsomorphic: true,
      };
    }
  }

  async componentDidMount() {
    if (!this.state.isIsomorphic) {
      await this.fetchInstances();
    }
  }

  async fetchInstances() {
    this.setState({
      instancesRes: { state: "loading" },
    });

    this.setState({
      instancesRes: await HttpService.client.getFederatedInstances({}),
    });
  }

  static async fetchInitialData({
    client,
  }: InitialFetchRequest): Promise<InstancesData> {
    return {
      federatedInstancesResponse: await client.getFederatedInstances({}),
    };
  }

  get documentTitle(): string {
    return `${I18NextService.i18n.t("instances")} - ${
      this.state.siteRes.site_view.site.name
    }`;
  }

  renderInstances() {
    switch (this.state.instancesRes.state) {
      case "loading":
        return (
          <h5>
            <Spinner large />
          </h5>
        );
      case "success": {
        const instances = this.state.instancesRes.data.federated_instances;
        return instances ? (
          <>
            <h1 className="h4 mb-4">{I18NextService.i18n.t("instances")}</h1>
            <div className="row">
              <div className="col-md-6">
                <h2 className="h5 mb-3">
                  {I18NextService.i18n.t("linked_instances")}
                </h2>
                {this.itemList(instances.linked)}
              </div>
            </div>
            <div className="row">
              {instances.allowed && instances.allowed.length > 0 && (
                <div className="col-md-6">
                  <h2 className="h5 mb-3">
                    {I18NextService.i18n.t("allowed_instances")}
                  </h2>
                  {this.itemList(instances.allowed)}
                </div>
              )}
              {instances.blocked && instances.blocked.length > 0 && (
                <div className="col-md-6">
                  <h2 className="h5 mb-3">
                    {I18NextService.i18n.t("blocked_instances")}
                  </h2>
                  {this.itemList(instances.blocked)}
                </div>
              )}
            </div>
          </>
        ) : (
          <></>
        );
      }
    }
  }

  render() {
    return (
      <div className="home-instances container-lg">
        <HtmlTags
          title={this.documentTitle}
          path={this.context.router.route.match.url}
        />
        {this.renderInstances()}
      </div>
    );
  }
  secondsToDhms(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    //var s = Math.floor(seconds % 60);
    
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute " : " minutes ") : "";
    //var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay;// + sDisplay;
  }

  itemList(items: Instance[]) {
    return items.length > 0 ? (
      <div className="table-responsive">
        <table id="instances_table" className="table table-sm table-hover">
          <thead className="pointer">
            <tr>
              <th>{I18NextService.i18n.t("name")}</th>
              <th>{I18NextService.i18n.t("software")}</th>
              <th>{I18NextService.i18n.t("version")}</th>
              <th>{I18NextService.i18n.t("First Seen")}</th>
              <th>{I18NextService.i18n.t("Last Seen")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.domain}>
                <td>
                  <a href={`https://${i.domain}`} rel={relTags}>
                    {i.domain}
                  </a>
                </td>
                <td>{i.software}</td>
                <td>{i.version}</td>
                <td>{i.published.toDateString()}</td>
                <td>{this.secondsToDhms(Math.floor((Date.now()-Date.parse(i.updated))/1000+(new Date().getTimezoneOffset()*60)))} ago</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div>{I18NextService.i18n.t("none_found")}</div>
    );
  }
}
//<td>{Math.floor((Date.now()-Date.parse(i.updated))/60/60/1000+(new Date().getTimezoneOffset()/60))} Hours ago</td>